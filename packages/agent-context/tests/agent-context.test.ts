import assert from "node:assert/strict";
import test from "node:test";
import { createSeed, cycleState, recordSession, subjectWeight } from "@meu-edital/domain";
import {
  applyChanges,
  buildStudyContext,
  importSyllabus,
  parseTaskResponse,
  previewChanges,
  renderPrompt,
  StudyContextSchema,
  syllabusTask,
  validateSyllabusImport,
  weeklyReviewTask,
} from "../src";

test("aceita nomes longos de resoluções na importação do edital", () => {
  const title =
    "Resolução CONTRAN nº 985/2022, com alterações das Resoluções nº 1.003/2023, nº 1.009/2024, nº 1.012/2024, nº 1.013/2024 e nº 1.031/2026";
  const parsed = parseTaskResponse(syllabusTask, {
    exam: "DETRAN-SP",
    role: "Agente",
    subjects: [{ name: "Resoluções do CONTRAN", topics: [{ name: title }] }],
  });
  assert.equal(parsed.subjects[0].topics[0].name, title);
});

test("limita os campos de texto a 1024 caracteres", () => {
  const longName = "a".repeat(1024);
  const exam = {
    exam: longName,
    role: longName,
    subjects: [{ name: longName, topics: [{ name: longName, subtopics: [{ name: longName }] }] }],
  };
  assert.equal(parseTaskResponse(syllabusTask, JSON.stringify(exam)).subjects[0].name, longName);
  assert.throws(
    () => parseTaskResponse(syllabusTask, JSON.stringify({ ...exam, role: `${longName}a` })),
    /Formato inválido/,
  );
  assert.throws(() => parseTaskResponse(syllabusTask, "{ invalid json }"), /JSON válido/);
});

test("importa edital com subassuntos sem duplicar registros e atualiza pesos", () => {
  let data = createSeed();
  const examId = data.activeExamId!;
  const input = parseTaskResponse(
    syllabusTask,
    '```json\n{"exam":"DETRAN-SP","role":"Agente","subjects":[{"name":"Português","questions":15,"pointsPerQuestion":2,"topics":[{"name":"Crase","subtopics":[{"name":"Uso facultativo"}]}]}]}\n```',
  );
  validateSyllabusImport(data, examId, input);
  data = importSyllabus(data, examId, input);
  const count = data.topics.length;
  data = importSyllabus(data, examId, input);
  assert.equal(data.topics.length, count);
  assert.ok(data.topics.some((t) => t.name === "Uso facultativo" && t.parentId));
  assert.equal(subjectWeight(data.subjects[0]), 30);
  assert.throws(
    () => validateSyllabusImport(data, examId, { ...input, exam: "Outro" }),
    /não corresponde/,
  );
});

test("o contexto segue o schema publicado e usa nomes em vez de ids", () => {
  let data = createSeed();
  const examId = data.activeExamId!;
  const block = cycleState(data, examId).next!;
  const topic = data.topics.find((t) => t.subjectId === block.subjectId)!;
  data = recordSession(data, {
    examId,
    subjectId: block.subjectId,
    topicId: topic.id,
    cycleItemId: block.id,
    type: "Questões",
    minutes: 60,
    questions: 10,
    correct: 6,
  });
  const context = buildStudyContext(data, examId);
  assert.doesNotThrow(() => StudyContextSchema.parse(context));
  assert.equal(context.weeks[0].current, true);
  assert.equal(context.weeks[0].minutes, 60);
  assert.equal(context.recentSessions[0].topic, topic.name);
  assert.ok(!JSON.stringify(context).includes(examId));
  const prompt = renderPrompt(weeklyReviewTask, data, examId);
  assert.match(prompt, /## Formato da resposta \(JSON Schema\)/);
  assert.match(prompt, /"setCycle"/);
});

test("propostas mostram prévia, validam nomes e são aplicadas", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const review = parseTaskResponse(weeklyReviewTask, {
    summary: "Ok",
    recommendations: [],
    changes: [
      { op: "setSubjectWeight", subject: "português", weight: 4 },
      { op: "setHoursPerWeek", hours: 20 },
      { op: "setCycle", blocks: [{ subject: "Português", minutes: 60 }, { subject: "Matemática", minutes: 45 }] },
    ],
  });
  const preview = previewChanges(data, examId, review.changes);
  assert.deepEqual(preview.map((p) => p.after), ["4", "20h", "2 blocos · 1h45"]);
  const next = applyChanges(data, examId, review.changes);
  assert.equal(subjectWeight(next.subjects[0]), 4);
  assert.equal(next.exams[0].hoursPerWeek, 20);
  assert.equal(cycleState(next, examId).items.length, 2);
  assert.throws(
    () => applyChanges(data, examId, [{ op: "setSubjectWeight", subject: "Biologia", weight: 1 }]),
    /Não encontramos a matéria/,
  );
  assert.throws(
    () => parseTaskResponse(weeklyReviewTask, { summary: "x", recommendations: [], changes: [{ op: "apagarTudo" }] }),
    /Formato inválido/,
  );
});
