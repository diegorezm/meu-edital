import assert from "node:assert/strict";
import test from "node:test";
import { createSeed } from "../src/domain/seed";
import {
  subjectWeight,
  weeklyAllocation,
  weeklyPlanBalance,
} from "../src/domain/weeklyAllocation";
import { parseExam } from "../src/features/ia/schemas/aiImportSchema";
import { importExam } from "../src/features/ia/services/importService";
import { ExternalCopyPasteProvider } from "../src/features/ia/services/externalCopyPasteProvider";

test("usa pontos da prova para dividir horas e preserva peso padrão", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  data.subjects = data.subjects.slice(0, 3);
  data.subjects[0].questions = 10;
  data.subjects[0].pointsPerQuestion = 2;
  data.subjects[1].weight = 10;
  data.exams[0].hoursPerWeek = 31;
  data.topics = [];
  const allocation = weeklyAllocation(data, examId);
  assert.deepEqual(
    allocation.map((item) => item.weight),
    [20, 10, 1],
  );
  assert.deepEqual(
    allocation.map((item) => item.minutes),
    [1200, 600, 60],
  );
  assert.equal(subjectWeight(data.subjects[2]), 1);
  assert.match(
    ExternalCopyPasteProvider.weeklyPrompt(data, examId),
    /"targetMinutes":1200/,
  );
});

test("revisões vencidas e baixo desempenho alteram a distribuição sem mudar o total", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  data.subjects = data.subjects.slice(0, 2);
  data.topics = data.topics.filter((topic) =>
    data.subjects.some((subject) => subject.id === topic.subjectId),
  );
  data.exams[0].hoursPerWeek = 10;
  data.reviews = [
    {
      id: "r",
      examId,
      topicId: data.topics[0].id,
      dueDate: "2020-01-01",
      completed: false,
      stage: 0,
    },
  ];
  data.sessions = [
    {
      id: "s",
      examId,
      subjectId: data.subjects[0].id,
      topicId: data.topics[0].id,
      type: "Questões",
      minutes: 30,
      date: "2026-01-01",
      questions: 10,
      correct: 2,
    },
  ];
  const allocation = weeklyAllocation(data, examId);
  assert.equal(
    allocation.reduce((sum, item) => sum + item.minutes, 0),
    600,
  );
  assert.equal(allocation[0].reviewMinutes, 20);
  assert.ok(allocation[0].minutes > allocation[1].minutes);
  const balance = weeklyPlanBalance(allocation, [
    {
      id: "p",
      examId,
      weekStart: "2026-09-21",
      day: 0,
      subjectId: data.subjects[0].id,
      topicId: data.topics[0].id,
      type: "Teoria",
      minutes: 600,
      order: 0,
      completed: false,
    },
  ]);
  assert.equal(balance.outsideTarget, true);
});

test("reserva pelo menos meia hora para matéria de baixo peso quando há tempo", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  data.subjects = data.subjects.slice(0, 2);
  data.topics = [];
  data.subjects[0].weight = 100;
  data.subjects[1].weight = 1;
  data.exams[0].hoursPerWeek = 2;
  assert.deepEqual(
    weeklyAllocation(data, examId).map((item) => item.minutes),
    [90, 30],
  );
});

test("importação reaproveita matéria existente e atualiza seus dados de peso", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const input = parseExam(
    JSON.stringify({
      exam: data.exams[0].name,
      role: data.exams[0].role,
      subjects: [
        {
          name: data.subjects[0].name,
          questions: 15,
          pointsPerQuestion: 2,
          topics: [{ name: "Novo assunto" }],
        },
      ],
    }),
  );
  const result = importExam(data, examId, input);
  assert.equal(result.subjects.length, data.subjects.length);
  assert.equal(subjectWeight(result.subjects[0]), 30);
  assert.equal(result.topics.at(-1)?.name, "Novo assunto");
  const changed = importExam(
    result,
    examId,
    parseExam(
      JSON.stringify({
        exam: data.exams[0].name,
        role: data.exams[0].role,
        subjects: [
          {
            name: data.subjects[0].name,
            weight: 5,
            topics: [{ name: "Novo assunto" }],
          },
        ],
      }),
    ),
  );
  assert.equal(subjectWeight(changed.subjects[0]), 5);
  assert.equal(changed.subjects[0].questions, undefined);
});
