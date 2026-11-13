import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { type AppData, emptyData, startExam, uid } from "@meu-edital/domain";
import {
  applyPulled,
  diffData,
  type Mutation,
  type PullResponse,
  type PushResponse,
  type SyncNotice,
} from "@meu-edital/sync";
import { app } from "../src/index";
import { call, verifiedUser } from "./helpers";

const exam = (data: AppData = emptyData()) =>
  startExam(data, {
    name: "TRT",
    hoursPerWeek: 10,
    subjects: [{ name: "Português", topics: ["Crase", "Concordância"] }],
  });

async function push(cookie: string, mutations: Mutation[]) {
  const response = await call("/api/sync/push", { body: { mutations }, cookie });
  return { status: response.status, body: (await response.json()) as PushResponse };
}

async function pullAll(cookie: string, since = 0) {
  const response = await call(`/api/sync/pull?since=${since}`, { cookie });
  return (await response.json()) as PullResponse;
}

describe("sync: push e pull", () => {
  it("faz ida e volta e reconstrói os mesmos dados em outro aparelho", async () => {
    const { cookie } = await verifiedUser();
    const data = exam();
    const { body } = await push(cookie, diffData(emptyData(), data));
    expect(body.rejected).toEqual([]);
    expect(body.version).toBe(body.accepted.length);

    const pulled = await pullAll(cookie);
    const rebuilt = applyPulled(emptyData(), pulled.changes);
    expect(rebuilt.activeExamId).toBe(data.activeExamId);
    expect(rebuilt.exams).toEqual(data.exams);
    expect(new Set(rebuilt.topics.map((t) => t.id))).toEqual(new Set(data.topics.map((t) => t.id)));
    expect(pulled.version).toBe(body.version);
    expect((await pullAll(cookie, pulled.version)).changes).toEqual([]);
  });

  it("reenviar o mesmo lote não aplica de novo", async () => {
    const { cookie } = await verifiedUser();
    const mutations = diffData(emptyData(), exam());
    const first = await push(cookie, mutations);
    const second = await push(cookie, mutations);
    expect(second.body.accepted).toHaveLength(mutations.length);
    expect(second.body.version).toBe(first.body.version);
  });

  it("propaga exclusões e limpa campos opcionais", async () => {
    const { cookie } = await verifiedUser();
    const data = exam();
    await push(cookie, diffData(emptyData(), data));
    const topic = data.topics[0];
    const withBoard = { ...data, exams: data.exams.map((e) => ({ ...e, board: "FCC" })) };
    const { body: v1 } = await push(cookie, diffData(data, withBoard));
    const without: AppData = {
      ...withBoard,
      exams: data.exams,
      topics: data.topics.filter((t) => t.id !== topic.id),
    };
    const { body: v2 } = await push(cookie, diffData(withBoard, without));

    const changes = (await pullAll(cookie, v1.version - 1)).changes;
    const deleted = changes.find((c) => c.row.id === topic.id);
    expect(deleted?.deleted).toBe(true);
    const rebuilt = applyPulled(emptyData(), (await pullAll(cookie)).changes);
    expect(rebuilt.topics.map((t) => t.id)).not.toContain(topic.id);
    expect(rebuilt.exams[0].board).toBeUndefined();
    expect(v2.version).toBeGreaterThan(v1.version);
  });

  it("dois aparelhos: vence a última escrita que chega", async () => {
    const { cookie } = await verifiedUser();
    const data = exam();
    await push(cookie, diffData(emptyData(), data));
    const rename = (name: string) => ({ ...data, exams: data.exams.map((e) => ({ ...e, name })) });
    const fromA = diffData(data, rename("A"));
    const fromB = diffData(data, rename("B"));
    await push(cookie, fromB);
    await push(cookie, fromA);
    const rebuilt = applyPulled(emptyData(), (await pullAll(cookie)).changes);
    expect(rebuilt.exams[0].name).toBe("A");
  });

  it("recusa mutação inválida com o motivo e aplica o resto", async () => {
    const { cookie } = await verifiedUser();
    const good = diffData(emptyData(), exam());
    const bad: Mutation = {
      id: uid(),
      table: "studySessions",
      op: "upsert",
      rowId: "s1",
      row: { id: "s1", minutes: -5 } as never,
    };
    const { status, body } = await push(cookie, [...good, bad]);
    expect(status).toBe(200);
    expect(body.accepted).toHaveLength(good.length);
    expect(body.rejected).toEqual([{ id: bad.id, reason: expect.stringContaining("Dado inválido") }]);
  });

  it("pagina o pull", async () => {
    const { cookie, userId } = await verifiedUser();
    const { syncData } = await import("../src/data/sync");
    const { createDb } = await import("@meu-edital/db");
    await push(cookie, diffData(emptyData(), exam()));
    const data = syncData(createDb(env.DB), userId);
    const first = await data.pull(0, 2);
    expect(first.changes).toHaveLength(2);
    expect(first.hasMore).toBe(true);
    const rest = await data.pull(first.version, 100);
    expect(rest.hasMore).toBe(false);
    expect(rest.changes[0].version).toBe(first.version + 1);
  });

  it("recusa lote com formato errado e exige sessão", async () => {
    const { cookie } = await verifiedUser();
    const response = await call("/api/sync/push", { body: { nada: true }, cookie });
    expect(response.status).toBe(400);
    expect((await call("/api/sync/pull?since=0")).status).toBe(401);
    expect((await call("/api/sync/push", { body: { mutations: [] } })).status).toBe(401);
  });
});

describe("sync: isolamento entre usuários", () => {
  it("não deixa alterar nem excluir linha de outro usuário pelo id", async () => {
    const ana = await verifiedUser();
    const bia = await verifiedUser();
    const data = exam();
    await push(ana.cookie, diffData(emptyData(), data));
    const examId = data.exams[0].id;

    const hijack = diffData(data, { ...data, exams: data.exams.map((e) => ({ ...e, name: "Roubado" })) });
    const { body } = await push(bia.cookie, hijack);
    expect(body.rejected[0].reason).toMatch(/outra conta/);
    const remove: Mutation = { id: uid(), table: "exams", op: "delete", rowId: examId };
    await push(bia.cookie, [remove]);

    const anaData = applyPulled(emptyData(), (await pullAll(ana.cookie)).changes);
    expect(anaData.exams[0].name).toBe("TRT");
    expect((await pullAll(bia.cookie)).changes.some((c) => c.row.id === examId)).toBe(false);
  });

  it("o pull só devolve linhas do próprio usuário", async () => {
    const ana = await verifiedUser();
    const bia = await verifiedUser();
    await push(ana.cookie, diffData(emptyData(), exam()));
    const biaData = exam();
    await push(bia.cookie, diffData(emptyData(), biaData));
    const ids = new Set((await pullAll(bia.cookie)).changes.map((c) => c.row.id));
    for (const topic of biaData.topics) expect(ids.has(topic.id)).toBe(true);
    expect(ids.size).toBe(diffData(emptyData(), biaData).length);
  });
});

describe("sync: avisos em tempo real", () => {
  it("avisa o aparelho conectado quando outro grava", async () => {
    const { cookie } = await verifiedUser();
    const response = await app.fetch(
      new Request(`${env.APP_URL}/api/sync/ws`, {
        headers: { upgrade: "websocket", cookie, origin: env.APP_URL },
      }),
      env,
      { waitUntil: () => undefined, passThroughOnException: () => undefined, props: {} } as never,
    );
    expect(response.status).toBe(101);
    const socket = response.webSocket!;
    socket.accept();
    const notice = new Promise<SyncNotice>((resolve) =>
      socket.addEventListener("message", (event) => resolve(JSON.parse(event.data as string))),
    );
    const { body } = await push(cookie, diffData(emptyData(), exam()));
    expect(await notice).toEqual({ type: "version", version: body.version });
    socket.close();
  });
});
