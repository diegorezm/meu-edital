import assert from "node:assert/strict";
import test from "node:test";
import { createSeed } from "../src/domain/seed";
import { examProgress } from "../src/domain/stats";
import {
  recordSession,
  validateSession,
} from "../src/features/estudar/services/sessionService";
import { addDays, today } from "../src/domain/types";
import {
  parseExam,
  parseWeeklyPlan,
} from "../src/features/ia/schemas/aiImportSchema";
import {
  importExam,
  resolveWeeklyPlan,
} from "../src/features/ia/services/importService";

test("aceita nomes longos de resoluções na importação do edital", () => {
  const title =
    "Resolução CONTRAN nº 985/2022, com alterações das Resoluções nº 1.003/2023, nº 1.009/2024, nº 1.012/2024, nº 1.013/2024 e nº 1.031/2026";
  const parsed = parseExam(
    JSON.stringify({
      exam: "DETRAN-SP",
      role: "Agente",
      subjects: [{ name: "Resoluções do CONTRAN", topics: [{ name: title }] }],
    }),
  );
  assert.equal(parsed.subjects[0].topics[0].name, title);
});

test("aceita até 1024 caracteres nos campos de texto da IA", () => {
  const longName = "a".repeat(1024);
  const exam = {
    exam: longName,
    role: longName,
    subjects: [
      {
        name: longName,
        topics: [{ name: longName, subtopics: [{ name: longName }] }],
      },
    ],
  };
  assert.equal(
    parseExam(JSON.stringify(exam)).subjects[0].topics[0].name,
    longName,
  );
  assert.throws(
    () => parseExam(JSON.stringify({ ...exam, role: `${longName}a` })),
    /Formato inválido/,
  );
  assert.equal(
    parseWeeklyPlan(
      JSON.stringify({
        sessions: [
          {
            day: "Seg",
            subject: longName,
            topic: longName,
            type: "Teoria",
            minutes: 60,
          },
        ],
      }),
    ).sessions[0].topic,
    longName,
  );
});

test("lê o plano semanal dentro de um bloco de código json", () => {
  const response = `Aqui está o plano:\n\`\`\`json\n{"sessions":[{"day":"Dom","subject":"Código de Trânsito Brasileiro","topic":"Penalidades","type":"Teoria","minutes":60}]}\n\`\`\``;
  assert.equal(parseWeeklyPlan(response).sessions[0].topic, "Penalidades");
});

test("importa JSON de edital com subassuntos sem duplicar registros", () => {
  let data = createSeed();
  const examId = data.activeExamId!;
  const input = parseExam(
    '```json\n{"exam":"DETRAN-SP","role":"Agente","subjects":[{"name":"Português","topics":[{"name":"Crase","subtopics":[{"name":"Uso facultativo"}]}]}]}\n```',
  );
  data = importExam(data, examId, input);
  const count = data.topics.length;
  data = importExam(data, examId, input);
  assert.equal(data.topics.length, count);
  assert.ok(
    data.topics.some((t) => t.name === "Uso facultativo" && t.parentId),
  );
});

test("rejeita plano com matéria inexistente e dados inválidos", () => {
  const data = createSeed();
  const plan = parseWeeklyPlan(
    '{"sessions":[{"day":"Seg","subject":"Biologia","topic":"Genética","type":"Teoria","minutes":60}]}',
  );
  assert.throws(
    () => resolveWeeklyPlan(data, data.activeExamId!, plan),
    /Não encontramos a matéria/,
  );
  assert.throws(
    () =>
      parseWeeklyPlan(
        '{"sessions":[{"day":"Seg","subject":"Português","topic":"Crase","type":"Teoria","minutes":0}]}',
      ),
    /Formato inválido/,
  );
  assert.throws(() => parseExam("{ invalid json }"), /JSON válido/);
});

test("sessão marca assunto, agenda revisões e soma progresso", () => {
  const data = createSeed();
  const subject = data.subjects[0];
  const topic = data.topics.find((t) => t.subjectId === subject.id)!;
  const input = {
    examId: data.activeExamId!,
    subjectId: subject.id,
    topicId: topic.id,
    type: "Questões" as const,
    minutes: 45,
    questions: 30,
    correct: 24,
  };
  assert.equal(validateSession(input), null);
  assert.match(validateSession({ ...input, correct: 31 }) || "", /Acertos/);
  const next = recordSession(data, input);
  assert.equal(next.reviews.length, 3);
  assert.deepEqual(
    next.reviews.map((r) => r.dueDate),
    [1, 7, 30].map((n) => addDays(today(), n)),
  );
  assert.ok(examProgress(next, data.activeExamId!) > 0);
  assert.equal(recordSession(next, input).reviews.length, 3);
});
