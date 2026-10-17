import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  emptyData,
  GENERAL_TOPIC,
  startExam,
  AppData,
  buildCycle,
  createSeed,
  cycleState,
  examProgress,
  recordSession,
  removeCycleItem,
  replaceCycle,
  subjectsBehind,
  subjectWeight,
  suggestNextTopic,
  today,
  topicPerformance,
  validateSession,
  weekStartOf,
  weekSummary,
  weeklyAllocation,
} from "../src";

function smallExam(): AppData {
  const data = createSeed();
  data.subjects = data.subjects.slice(0, 3);
  data.topics = data.topics.filter((topic) =>
    data.subjects.some((subject) => subject.id === topic.subjectId),
  );
  data.cycle = [];
  return data;
}

test("usa pontos da prova para dividir horas e preserva peso padrão", () => {
  const data = smallExam();
  const examId = data.activeExamId!;
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
});

test("revisões vencidas e baixo desempenho alteram a distribuição sem mudar o total", () => {
  const data = smallExam();
  const examId = data.activeExamId!;
  data.subjects = data.subjects.slice(0, 2);
  data.exams[0].hoursPerWeek = 10;
  const topic = data.topics.find((t) => t.subjectId === data.subjects[0].id)!;
  data.reviews = [
    { id: "r", examId, topicId: topic.id, dueDate: "2020-01-01", completed: false, stage: 1 },
  ];
  data.sessions = [
    {
      id: "s",
      examId,
      subjectId: data.subjects[0].id,
      topicId: topic.id,
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
});

test("reserva pelo menos meia hora para matéria de baixo peso quando há tempo", () => {
  const data = smallExam();
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

test("gera um ciclo proporcional ao peso e sem repetir matéria em sequência", () => {
  const data = smallExam();
  const examId = data.activeExamId!;
  data.topics = [];
  data.subjects[0].weight = 3;
  data.subjects[1].weight = 2;
  data.subjects[2].weight = 1;
  data.exams[0].hoursPerWeek = 12;
  const cycle = buildCycle(data, examId);
  const count = (id: string) => cycle.filter((item) => item.subjectId === id).length;
  assert.deepEqual(data.subjects.map((s) => count(s.id)), [6, 4, 2]);
  assert.equal(cycle.reduce((sum, item) => sum + item.minutes, 0), 720);
  for (let index = 1; index < cycle.length; index += 1)
    assert.notEqual(cycle[index].subjectId, cycle[index - 1].subjectId);
  assert.deepEqual(cycle.map((item) => item.order), cycle.map((_, i) => i));
});

test("sessão do ciclo avança o bloco e conta a volta ao final", () => {
  let data = smallExam();
  const examId = data.activeExamId!;
  data.exams[0].hoursPerWeek = 3;
  data = replaceCycle(data, examId, buildCycle(data, examId));
  const { items } = cycleState(data, examId);
  assert.equal(items.length, 3);
  for (const item of items) {
    const topic = suggestNextTopic(data, item.subjectId)!;
    data = recordSession(data, {
      examId,
      subjectId: item.subjectId,
      topicId: topic.id,
      cycleItemId: item.id,
      type: "Teoria",
      minutes: item.minutes,
    });
  }
  const state = cycleState(data, examId);
  assert.equal(state.position, 0);
  assert.equal(state.laps, 1);
  assert.equal(weekSummary(data, examId).cycleBlocks, 3);
});

test("remover um bloco anterior mantém o próximo bloco", () => {
  let data = smallExam();
  const examId = data.activeExamId!;
  data.exams[0].hoursPerWeek = 3;
  data = replaceCycle(data, examId, buildCycle(data, examId));
  const before = cycleState(data, examId).items;
  data.exams[0].cyclePosition = 2;
  data = removeCycleItem(data, examId, before[0].id);
  assert.equal(cycleState(data, examId).next?.id, before[2].id);
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

test("sessão de revisão conclui a revisão vencida do assunto", () => {
  const data = createSeed();
  const topic = data.topics[0];
  const examId = data.activeExamId!;
  const studied = recordSession(
    data,
    { examId, subjectId: topic.subjectId, topicId: topic.id, type: "Teoria", minutes: 30 },
    addDays(today(), -1),
  );
  const reviewed = recordSession(studied, {
    examId,
    subjectId: topic.subjectId,
    topicId: topic.id,
    type: "Revisão",
    minutes: 15,
  });
  assert.deepEqual(
    reviewed.reviews.map((r) => r.completed),
    [true, false, false],
  );
});

test("resumo semanal compara o estudado com a meta por matéria", () => {
  const data = smallExam();
  const examId = data.activeExamId!;
  data.exams[0].hoursPerWeek = 3;
  data.topics = [];
  const week = weekStartOf("2026-09-23");
  assert.equal(week, "2026-09-21");
  data.sessions = [
    { id: "1", examId, subjectId: data.subjects[0].id, topicId: "t", type: "Questões", minutes: 60, date: "2026-09-21", questions: 10, correct: 7 },
    { id: "2", examId, subjectId: data.subjects[0].id, topicId: "t", type: "Teoria", minutes: 30, date: "2026-09-27" },
    { id: "3", examId, subjectId: data.subjects[1].id, topicId: "t", type: "Teoria", minutes: 50, date: "2026-09-28" },
  ];
  const summary = weekSummary(data, examId, week);
  assert.equal(summary.minutes, 90);
  assert.equal(summary.targetMinutes, 180);
  assert.equal(summary.accuracy, 70);
  assert.equal(summary.days[6].minutes, 30);
  assert.deepEqual(
    subjectsBehind(summary).map((s) => s.name),
    [data.subjects[1].name, data.subjects[2].name],
  );
});

test("sugere o próximo assunto não estudado, preferindo subassuntos", () => {
  const data = createSeed();
  const subjectId = data.subjects[0].id;
  const [first] = data.topics.filter((t) => t.subjectId === subjectId);
  data.topics.push({ id: "sub", subjectId, parentId: first.id, name: "Tipos de texto", studied: false });
  assert.equal(suggestNextTopic(data, subjectId)?.id, "sub");
  data.topics = data.topics.map((t) => (t.subjectId === subjectId ? { ...t, studied: true } : t));
  data.sessions = data.topics
    .filter((t) => t.subjectId === subjectId)
    .map((t, index) => ({
      id: t.id,
      examId: data.activeExamId!,
      subjectId,
      topicId: t.id,
      type: "Teoria" as const,
      minutes: 30,
      date: t.id === "sub" ? "2026-01-01" : `2026-02-0${index + 1}`,
    }));
  assert.equal(suggestNextTopic(data, subjectId)?.id, "sub");
});

test("agrupa desempenho por assunto", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const topic = data.topics[0];
  data.sessions = [10, 20].map((questions, index) => ({
    id: String(index),
    examId,
    subjectId: topic.subjectId,
    topicId: topic.id,
    type: "Questões" as const,
    minutes: 30,
    date: `2026-09-2${index}`,
    questions,
    correct: index ? 10 : 8,
  }));
  const row = topicPerformance(data, examId).find((item) => item.topic.id === topic.id);
  assert.equal(row?.accuracy, 60);
  assert.equal(row?.sessions, 2);
  assert.equal(row?.lastStudied, "2026-09-21");
});

test("startExam cria concurso ativo com assuntos e ciclo do tamanho da meta", () => {
  const data = startExam(emptyData(), {
    name: "  TRT  ",
    hoursPerWeek: 10,
    subjects: [
      { name: "Português", topics: ["Crase", " "] },
      { name: "português" },
      { name: "Informática" },
      { name: "  " },
    ],
  });
  const exam = data.exams[0];
  assert.equal(exam.name, "TRT");
  assert.equal(data.activeExamId, exam.id);
  assert.deepEqual(
    data.subjects.map((item) => item.name),
    ["Português", "Informática"],
  );
  assert.deepEqual(
    data.topics.map((item) => item.name),
    ["Crase", GENERAL_TOPIC],
  );
  const { items, lapMinutes, next } = cycleState(data, exam.id);
  assert.ok(items.length > 0);
  assert.equal(lapMinutes, 600);
  assert.ok(suggestNextTopic(data, next!.subjectId));
});
