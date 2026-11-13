import { describe, expect, it } from "vitest";
import { emptyData, recordSession, startExam } from "@meu-edital/domain";
import { diffData } from "@meu-edital/sync";
import { call, verifiedUser } from "./helpers";

async function studentWithSession(examName: string) {
  const student = await verifiedUser();
  const exam = startExam(emptyData(), { name: examName, hoursPerWeek: 10, subjects: [{ name: "Português", topics: ["Crase"] }] });
  const topic = exam.topics[0];
  const data = recordSession(
    exam,
    { examId: exam.activeExamId!, subjectId: topic.subjectId, topicId: topic.id, type: "Teoria", minutes: 25 },
    "2026-11-10",
  );
  await call("/api/sync/push", { body: { mutations: diffData(emptyData(), data) }, cookie: student.cookie });
  return student;
}

describe("exportação", () => {
  it("exporta só os dados do próprio estudante, em JSON e CSV", async () => {
    const ana = await studentWithSession("Concurso da Ana");
    await studentWithSession("Concurso da Bia");

    const json = await call("/api/export", { cookie: ana.cookie });
    expect(json.headers.get("content-disposition")).toMatch(/attachment; filename="meu-edital-.*\.json"/);
    const body = (await json.json()) as { concursos: { name: string; sessoes: unknown[] }[] };
    expect(body.concursos.map((c) => c.name)).toEqual(["Concurso da Ana"]);
    expect(body.concursos[0].sessoes).toHaveLength(1);

    const csv = await call("/api/export?formato=csv", { cookie: ana.cookie });
    const text = await csv.text();
    expect(text).toContain("2026-11-10;Concurso da Ana;Português;Crase;Teoria;25");
    expect(text).not.toContain("Bia");
  });

  it("exige sessão", async () => {
    expect((await call("/api/export")).status).toBe(401);
  });
});
