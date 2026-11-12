import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createDb } from "@meu-edital/db";
import { userData } from "../src/data/access";
import { call, verifiedUser } from "./helpers";

async function insertExam(userId: string, name: string, version: number) {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "insert into exams (id, user_id, updated_at, version, name, role, hours_per_week, created_at) values (?, ?, ?, ?, ?, 'Cargo', 10, '2026-11-12')",
  )
    .bind(id, userId, Date.now(), version, name)
    .run();
  return id;
}

describe("camada de acesso", () => {
  it("nunca devolve linhas de outro usuário", async () => {
    const ana = await verifiedUser();
    const bia = await verifiedUser();
    const anaExam = await insertExam(ana.userId, "Concurso da Ana", 1);
    const biaExam = await insertExam(bia.userId, "Concurso da Bia", 1);

    const data = userData(createDb(env.DB), ana.userId);
    expect((await data.active("exams")).map((row) => row.id)).toEqual([anaExam]);
    expect((await data.changedSince("exams")).map((row) => row.id)).toEqual([anaExam]);
    expect(await data.find("exams", biaExam)).toBeUndefined();
    expect(await data.find("exams", anaExam)).toMatchObject({ name: "Concurso da Ana" });
  });

  it("filtra por versão e esconde excluídos só na leitura ativa", async () => {
    const { userId } = await verifiedUser();
    await insertExam(userId, "Antigo", 1);
    const recent = await insertExam(userId, "Recente", 2);
    await env.DB.prepare("update exams set deleted_at = ? where id = ?").bind(Date.now(), recent).run();

    const data = userData(createDb(env.DB), userId);
    expect((await data.changedSince("exams", 1)).map((row) => row.name)).toEqual(["Recente"]);
    expect((await data.active("exams")).map((row) => row.name)).toEqual(["Antigo"]);
  });
});

describe("rotas de dados", () => {
  it("/api/me responde só com o usuário da sessão", async () => {
    const ana = await verifiedUser();
    const bia = await verifiedUser();
    const response = await call("/api/me", { cookie: ana.cookie });
    const body = (await response.json()) as { user: { id: string } };
    expect(body.user.id).toBe(ana.userId);
    expect(body.user.id).not.toBe(bia.userId);
  });
});
