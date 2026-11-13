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
import { diffData, orderBatch, rowSchemas, TABLES } from "../src";
import { memoryStorage, SyncClient } from "../src/clientEntry";
import { fakeServer } from "./fakeServer";

const newExam = (data: AppData) =>
  startExam(data, {
    name: "TRT",
    hoursPerWeek: 10,
    subjects: [{ name: "Português", topics: ["Crase"] }, { name: "Informática" }],
  });

const leader = {
  requestLeadership: async () => true,
  releaseLeadership: () => undefined,
  isLeader: () => true,
  onLeadershipChange: () => () => undefined,
};

function onlineDetector(transport: { state: { online: boolean } }) {
  const listeners = new Set<() => void>();
  return {
    subscribe: (cb: () => void) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    notifyOnline: () => listeners.forEach((l) => l()),
    isOnline: () => transport.state.online,
    dispose: () => listeners.clear(),
  };
}

const tick = () => new Promise((r) => (globalThis as unknown as { setTimeout: (f: unknown, ms: number) => void }).setTimeout(r, 30));

async function device(
  server: ReturnType<typeof fakeServer>,
  online = true,
  options: { pageSize?: number; storage?: ReturnType<typeof memoryStorage> } = {},
) {
  const transport = server.transport({ online, pageSize: options.pageSize });
  const storage = options.storage ?? memoryStorage();
  const client = new SyncClient({
    transport,
    storage,
    leaderElection: leader,
    onlineDetector: onlineDetector(transport),
  });
  await client.start();
  const goOnline = async () => {
    transport.state.online = true;
    client.online();
    await client.flush();
    await client.sync();
  };
  return { client, transport, storage, goOnline };
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

  it("orderBatch reordena um lote misturado com segurança", () => {
    const created = newExam(emptyData());
    const shuffled = [...diffData(emptyData(), created)].reverse();
    const ordered = orderBatch(shuffled).map((m) => TABLES.indexOf(m.table));
    expect(ordered).toEqual([...ordered].sort((a, b) => a - b));
  });
});

describe("cliente de sync", () => {
  it("faz ida e volta: o que um aparelho grava aparece no outro", async () => {
    const server = fakeServer();
    const a = await device(server);
    const b = await device(server);
    a.client.update(newExam);
    await a.client.flush();
    await b.client.sync();
    expect(b.client.data().exams).toHaveLength(1);
    expect(b.client.data().activeExamId).toBe(a.client.data().activeExamId);
    expect(b.client.data().topics.map((t) => t.name).sort()).toEqual(
      a.client.data().topics.map((t) => t.name).sort(),
    );
  });

  it("mostra a alteração na hora, antes da rede", async () => {
    const server = fakeServer();
    const a = await device(server, false);
    a.client.update(newExam);
    expect(a.client.data().exams).toHaveLength(1);
  });

  it("funciona offline e envia a fila quando a rede volta", async () => {
    const server = fakeServer();
    const a = await device(server, false);
    a.client.update(newExam);
    await tick();
    expect(a.client.data().exams).toHaveLength(1);
    expect(a.client.getState().pending).toBeGreaterThan(0);
    expect(server.rows.size).toBe(0);
    await a.goOnline();
    expect(a.client.getState().pending).toBe(0);
    expect(server.rows.size).toBeGreaterThan(0);
    expect(a.client.data().exams).toHaveLength(1);
  });

  it("guarda a fila e envia depois de reabrir o app", async () => {
    const server = fakeServer();
    const storage = memoryStorage();
    const first = await device(server, false, { storage });
    first.client.update(newExam);
    await tick();
    first.client.dispose();

    const reopened = await device(server, true, { storage });
    await tick();
    await reopened.client.flush();
    await reopened.client.sync();
    expect(server.rows.size).toBeGreaterThan(0);
    expect(reopened.client.data().exams).toHaveLength(1);
  });

  it("reenviar o mesmo lote não aplica duas vezes", () => {
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
    a.client.update(newExam);
    const examId = a.client.data().activeExamId!;
    const topic = a.client.data().topics[0];
    a.client.update((data) =>
      recordSession(data, {
        examId,
        subjectId: topic.subjectId,
        topicId: topic.id,
        type: "Teoria",
        minutes: 30,
      }),
    );
    await a.client.flush();
    await b.client.sync();
    expect(b.client.data().sessions).toHaveLength(1);
    expect(b.client.data().reviews).toHaveLength(3);

    const sessionId = a.client.data().sessions[0].id;
    a.client.update((data) => deleteSession(data, sessionId));
    await a.client.flush();
    await b.client.sync();
    expect(b.client.data().sessions).toEqual([]);
    expect(b.client.data().reviews).toEqual([]);
  });

  it("dois aparelhos offline: vence a última escrita que chega ao servidor", async () => {
    const server = fakeServer();
    const a = await device(server);
    const b = await device(server);
    a.client.update(newExam);
    await a.client.flush();
    await b.client.sync();
    const examId = a.client.data().activeExamId!;
    const rename = (name: string) => (data: AppData) => ({
      ...data,
      exams: data.exams.map((e) => (e.id === examId ? { ...e, name } : e)),
    });
    a.transport.state.online = false;
    b.transport.state.online = false;
    b.client.update(rename("Nome do B"));
    a.client.update(rename("Nome do A"));
    expect(a.client.data().exams[0].name).toBe("Nome do A");
    await b.goOnline();
    await a.goOnline();
    await b.client.sync();
    expect(a.client.data().exams[0].name).toBe("Nome do A");
    expect(b.client.data().exams[0].name).toBe("Nome do A");
  });

  it("mutação recusada fica visível com o motivo e o servidor manda", async () => {
    const server = fakeServer();
    const a = await device(server);
    a.client.update((data) => ({
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
    await a.client.flush();
    const state = a.client.getState();
    expect(state.pending).toBe(0);
    expect(state.rejected).toHaveLength(1);
    expect(state.rejected[0].reason).toBe("Linha inválida.");
    expect(state.rejected[0].mutation.rowId).toBe("x");
    expect(a.client.data().exams).toEqual([]);
    a.client.dismissRejected();
    expect(a.client.getState().rejected).toEqual([]);
  });

  it("puxa em páginas até o fim", async () => {
    const server = fakeServer();
    const a = await device(server);
    a.client.update(newExam);
    await a.client.flush();
    const b = await device(server, true, { pageSize: 2 });
    expect(b.client.data().topics).toHaveLength(a.client.data().topics.length);
    expect(b.client.cursor()).toBe(server.version);
  });

  it("alteração pendente não é sobrescrita por um pull", async () => {
    const server = fakeServer();
    const a = await device(server);
    const b = await device(server);
    a.client.update(newExam);
    await a.client.flush();
    await b.client.sync();
    const examId = a.client.data().activeExamId!;
    b.transport.state.online = false;
    b.client.update((data) => ({ ...data, exams: data.exams.map((e) => ({ ...e, name: "Local" })) }));
    a.client.update((data) => ({ ...data, exams: data.exams.map((e) => ({ ...e, name: "Remoto" })) }));
    await a.client.flush();
    b.transport.state.online = true;
    await b.client.sync();
    expect(b.client.data().exams.find((e) => e.id === examId)!.name).toBe("Local");
  });
});
