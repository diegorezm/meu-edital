import { describe, expect, it } from "vitest";
import {
  type AppData,
  createSeed,
  deleteSession,
  emptyData,
  recordSession,
  removeExam,
  startExam,
} from "@meu-edital/domain";
import {
  applyPulled,
  diffData,
  enqueue,
  memoryStore,
  orderBatch,
  rowSchemas,
  SyncEngine,
  TABLES,
} from "../src";
import { fakeServer } from "./fakeServer";

const newExam = (data: AppData) =>
  startExam(data, {
    name: "TRT",
    hoursPerWeek: 10,
    subjects: [{ name: "Português", topics: ["Crase"] }, { name: "Informática" }],
  });

async function device(server: ReturnType<typeof fakeServer>, online = true) {
  const transport = server.transport({ online });
  const store = memoryStore();
  const engine = new SyncEngine(store, transport, emptyData);
  await engine.start();
  return { engine, transport, store };
}

describe("diffData", () => {
  it("gera upserts de pais para filhos e exclusões de filhos para pais", () => {
    const created = newExam(emptyData());
    const mutations = diffData(emptyData(), created);
    const tables = mutations.map((m) => m.table);
    expect(tables[0]).toBe("userSettings");
    expect(tables.indexOf("exams")).toBeLessThan(tables.indexOf("subjects"));
    expect(tables.lastIndexOf("subjects")).toBeLessThan(tables.indexOf("topics"));
    expect(tables.lastIndexOf("topics")).toBeLessThan(tables.indexOf("cycleItems"));
    for (const m of mutations)
      if (m.op === "upsert") expect(rowSchemas[m.table].safeParse(m.row).success).toBe(true);

    const removed = removeExam(created, created.activeExamId!);
    const deletes = diffData(created, removed).filter((m) => m.op === "delete");
    const order = deletes.map((m) => TABLES.indexOf(m.table));
    expect(order).toEqual([...order].sort((a, b) => b - a));
  });

  it("não gera nada quando só a referência mudou", () => {
    const data = createSeed();
    expect(diffData(data, { ...data, exams: data.exams.map((e) => ({ ...e })) })).toEqual([]);
  });

  it("a fila guarda só a mutação mais recente de cada linha", () => {
    const data = createSeed();
    const exam = data.exams[0];
    const first = diffData(data, { ...data, exams: [{ ...exam, name: "A" }] });
    const second = diffData(data, { ...data, exams: [{ ...exam, name: "B" }] });
    const outbox = enqueue(first, second);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].op === "upsert" && (outbox[0].row as { name: string }).name).toBe("B");
  });

  it("orderBatch reordena um lote misturado com segurança", () => {
    const created = newExam(emptyData());
    const shuffled = [...diffData(emptyData(), created)].reverse();
    const ordered = orderBatch(shuffled).map((m) => TABLES.indexOf(m.table));
    expect(ordered).toEqual([...ordered].sort((a, b) => a - b));
  });
});

describe("motor de sync", () => {
  it("faz ida e volta: o que um aparelho grava aparece no outro", async () => {
    const server = fakeServer();
    const a = await device(server);
    const b = await device(server);
    a.engine.update(newExam);
    await a.engine.sync();
    await b.engine.sync();
    expect(b.engine.getState().data.exams).toHaveLength(1);
    expect(b.engine.getState().data.activeExamId).toBe(a.engine.getState().data.activeExamId);
    expect(b.engine.getState().data.topics.map((t) => t.name).sort()).toEqual(
      a.engine.getState().data.topics.map((t) => t.name).sort(),
    );
  });

  it("funciona offline e envia a fila quando a rede volta", async () => {
    const server = fakeServer();
    const a = await device(server, false);
    a.engine.update(newExam);
    await a.engine.sync();
    expect(a.engine.getState().status).toBe("offline");
    expect(a.engine.getState().outbox.length).toBeGreaterThan(0);
    expect(server.rows.size).toBe(0);

    a.transport.state.online = true;
    await a.engine.sync();
    expect(a.engine.getState().status).toBe("idle");
    expect(a.engine.getState().outbox).toEqual([]);
    expect(server.rows.size).toBeGreaterThan(0);
  });

  it("guarda dados e fila no banco local e retoma depois de fechar o app", async () => {
    const server = fakeServer();
    const transport = server.transport({ online: false });
    const store = memoryStore();
    const first = new SyncEngine(store, transport, emptyData);
    await first.start();
    first.update(newExam);
    await first.flush();

    const reopened = new SyncEngine(store, transport, emptyData);
    await reopened.start();
    expect(reopened.getState().data.exams).toHaveLength(1);
    expect(reopened.getState().outbox.length).toBe(first.getState().outbox.length);
  });

  it("reenviar o mesmo lote não aplica duas vezes", async () => {
    const server = fakeServer();
    const created = newExam(emptyData());
    const mutations = diffData(emptyData(), created);
    server.push({ mutations });
    const version = server.version;
    const again = server.push({ mutations });
    expect(again.accepted).toHaveLength(mutations.length);
    expect(server.version).toBe(version);
  });

  it("exclusões chegam aos outros aparelhos", async () => {
    const server = fakeServer();
    const a = await device(server);
    const b = await device(server);
    a.engine.update(newExam);
    const examId = a.engine.getState().data.activeExamId!;
    const topic = a.engine.getState().data.topics[0];
    a.engine.update((data) =>
      recordSession(data, {
        examId,
        subjectId: topic.subjectId,
        topicId: topic.id,
        type: "Teoria",
        minutes: 30,
      }),
    );
    await a.engine.sync();
    await b.engine.sync();
    expect(b.engine.getState().data.sessions).toHaveLength(1);
    expect(b.engine.getState().data.reviews).toHaveLength(3);

    const sessionId = a.engine.getState().data.sessions[0].id;
    a.engine.update((data) => deleteSession(data, sessionId));
    await a.engine.sync();
    await b.engine.sync();
    expect(b.engine.getState().data.sessions).toEqual([]);
    expect(b.engine.getState().data.reviews).toEqual([]);
  });

  it("dois aparelhos offline: vence a última escrita que chega ao servidor", async () => {
    const server = fakeServer();
    const a = await device(server);
    const b = await device(server);
    a.engine.update(newExam);
    await a.engine.sync();
    await b.engine.sync();
    const examId = a.engine.getState().data.activeExamId!;
    const rename = (name: string) => (data: AppData) => ({
      ...data,
      exams: data.exams.map((e) => (e.id === examId ? { ...e, name } : e)),
    });

    a.transport.state.online = false;
    b.transport.state.online = false;
    a.engine.update(rename("Nome do A"));
    b.engine.update(rename("Nome do B"));
    // A local pendente vale no próprio aparelho enquanto não é enviada.
    expect(a.engine.getState().data.exams[0].name).toBe("Nome do A");

    b.transport.state.online = true;
    await b.engine.sync();
    a.transport.state.online = true;
    await a.engine.sync();
    await b.engine.sync();

    expect(a.engine.getState().data.exams[0].name).toBe("Nome do A");
    expect(b.engine.getState().data.exams[0].name).toBe("Nome do A");
  });

  it("mutação recusada sai da fila e fica visível com o motivo", async () => {
    const server = fakeServer();
    const a = await device(server);
    a.engine.update((data) => ({
      ...data,
      exams: [
        {
          id: "x",
          name: "Ruim",
          role: "",
          hoursPerWeek: 999,
          createdAt: "2026-11-12",
          cyclePosition: 0,
          cycleLaps: 0,
        },
      ],
    }));
    await a.engine.sync();
    const state = a.engine.getState();
    expect(state.outbox).toEqual([]);
    expect(state.rejected).toHaveLength(1);
    expect(state.rejected[0].reason).toBe("Linha inválida.");
    expect(state.rejected[0].mutation.rowId).toBe("x");
    a.engine.dismissRejected();
    expect(a.engine.getState().rejected).toEqual([]);
  });

  it("puxa em páginas até o fim", async () => {
    const server = fakeServer();
    const a = await device(server);
    a.engine.update(newExam);
    await a.engine.sync();
    const b = { engine: new SyncEngine(memoryStore(), server.transport({ online: true, pageSize: 2 }), emptyData) };
    await b.engine.start();
    await b.engine.sync();
    expect(b.engine.getState().data.topics).toHaveLength(a.engine.getState().data.topics.length);
    expect(b.engine.getState().cursor).toBe(server.version);
  });

  it("applyPulled não sobrescreve linhas com mutação pendente", () => {
    const data = createSeed();
    const exam = data.exams[0];
    const local = { ...data, exams: [{ ...exam, name: "Local" }] };
    const outbox = diffData(data, local);
    const merged = applyPulled(
      local,
      [{ table: "exams", row: { ...exam, name: "Remoto" }, deleted: false, version: 9 }],
      outbox,
    );
    expect(merged.exams[0].name).toBe("Local");
  });
});
