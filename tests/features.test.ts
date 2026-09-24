import assert from "node:assert/strict";
import test from "node:test";
import { createSeed } from "../src/domain/seed";
import {
  getTodayPlan,
  getTopicPerformance,
} from "../src/features/inicio/utils/dashboardSelectors";
import { normalizeText } from "../src/global/utils/normalizeText";

test("seleciona o plano da semana da data informada", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const subject = data.subjects[0];
  const topic = data.topics[0];
  data.planned = [
    {
      id: "atual",
      examId,
      weekStart: "2026-09-21",
      day: 2,
      subjectId: subject.id,
      topicId: topic.id,
      type: "Teoria",
      minutes: 30,
      order: 2,
      completed: false,
    },
    {
      id: "primeiro",
      examId,
      weekStart: "2026-09-21",
      day: 2,
      subjectId: subject.id,
      topicId: topic.id,
      type: "Questões",
      minutes: 30,
      order: 1,
      completed: false,
    },
    {
      id: "outra-semana",
      examId,
      weekStart: "2026-09-14",
      day: 2,
      subjectId: subject.id,
      topicId: topic.id,
      type: "Teoria",
      minutes: 30,
      order: 0,
      completed: false,
    },
  ];

  assert.deepEqual(
    getTodayPlan(data, examId, new Date("2026-09-23T12:00:00")).map(
      (item) => item.id,
    ),
    ["primeiro", "atual"],
  );
});

test("agrupa sessões por assunto e mantém busca sem acentos", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const topic = data.topics[0];
  data.sessions = [
    {
      id: "1",
      examId,
      subjectId: topic.subjectId,
      topicId: topic.id,
      type: "Questões",
      minutes: 30,
      date: "2026-09-23",
      questions: 10,
      correct: 8,
    },
    {
      id: "2",
      examId,
      subjectId: topic.subjectId,
      topicId: topic.id,
      type: "Questões",
      minutes: 30,
      date: "2026-09-23",
      questions: 20,
      correct: 10,
    },
  ];

  assert.deepEqual(
    getTopicPerformance(data, examId).find(
      (item) => item.topic.id === topic.id,
    ),
    {
      topic,
      rate: 60,
      count: 2,
    },
  );
  assert.equal(normalizeText(" Matemática ").trim(), "matematica");
});
