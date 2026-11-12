import { assert, test } from "vitest";
import {
  type AppData,
  addDays,
  buildCycle,
  createSeed,
  currentWeekStart,
  cycleState,
  deleteSession,
  dueReviews,
  ensureWeekTarget,
  examProgress,
  isTopicStudied,
  recordSession,
  replaceCycle,
  skipToCycleItem,
  today,
  topicsInOrder,
  uid,
  updateSession,
  UUID_PATTERN,
  weeklyAllocation,
  weekSummary,
} from "../src";

function threeBlockExam(): { data: AppData; examId: string } {
  let data = createSeed();
  const examId = data.activeExamId!;
  data.subjects = data.subjects.slice(0, 3);
  data.exams[0] = { ...data.exams[0], hoursPerWeek: 3 };
  data = replaceCycle(data, examId, buildCycle(data, examId));
  return { data, examId };
}

function studyBlock(data: AppData, examId: string, type: "Teoria" | "Revisão" = "Teoria") {
  const block = cycleState(data, examId).next!;
  const topic = topicsInOrder(data, block.subjectId)[0];
  return recordSession(data, {
    examId,
    subjectId: block.subjectId,
    topicId: topic.id,
    cycleItemId: block.id,
    type,
    minutes: block.minutes,
  });
}

test("uid gera UUIDv7 com o instante no começo", () => {
  const now = Date.UTC(2026, 10, 12);
  const id = uid(now);
  assert.match(id, UUID_PATTERN);
  assert.equal(id[14], "7");
  assert.include("89ab", id[19]);
  assert.equal(id.replace(/-/g, "").slice(0, 12), now.toString(16).padStart(12, "0"));
  assert.ok(uid(1000) < uid(2000));
});

test("a ordem dos assuntos vem de position, não do id", () => {
  const data = createSeed();
  const subjectId = data.subjects[0].id;
  data.topics = data.topics.map((t) =>
    t.subjectId === subjectId ? { ...t, position: 10 - t.position } : t,
  );
  const names = topicsInOrder(data, subjectId).map((t) => t.name);
  assert.deepEqual(names, ["Concordância", "Crase", "Interpretação de textos"]);
});

test("excluir a sessão desfaz assunto estudado, revisões e posição do ciclo", () => {
  const { data, examId } = threeBlockExam();
  const studied = studyBlock(data, examId);
  const session = studied.sessions[0];
  assert.ok(isTopicStudied(studied, session.topicId));
  assert.equal(studied.reviews.length, 3);
  assert.equal(cycleState(studied, examId).position, 1);

  const undone = deleteSession(studied, session.id);
  assert.notOk(isTopicStudied(undone, session.topicId));
  assert.equal(undone.reviews.length, 0);
  assert.equal(cycleState(undone, examId).position, 0);
  assert.equal(examProgress(undone, examId), 0);
});

test("excluir uma sessão antiga não mexe na posição atual do ciclo", () => {
  const { data, examId } = threeBlockExam();
  const first = studyBlock(data, examId);
  const second = studyBlock(first, examId);
  const undone = deleteSession(second, first.sessions[0].id);
  assert.equal(cycleState(undone, examId).position, 2);
});

test("excluir a sessão que fechou a volta desconta a volta", () => {
  const { data, examId } = threeBlockExam();
  let next = data;
  for (let i = 0; i < 3; i += 1) next = studyBlock(next, examId);
  assert.equal(cycleState(next, examId).laps, 1);
  const undone = deleteSession(next, next.sessions[0].id);
  assert.equal(cycleState(undone, examId).laps, 0);
  assert.equal(cycleState(undone, examId).position, 2);
});

test("pular bloco impede que excluir a sessão anterior volte a jornada", () => {
  const { data, examId } = threeBlockExam();
  const studied = studyBlock(data, examId);
  const last = cycleState(studied, examId).items[2];
  const skipped = skipToCycleItem(studied, examId, last.id);
  const undone = deleteSession(skipped, studied.sessions[0].id);
  assert.equal(cycleState(undone, examId).position, 2);
});

test("excluir a sessão de revisão reabre a revisão que ela concluiu", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const topic = data.topics[0];
  const base = { examId, subjectId: topic.subjectId, topicId: topic.id, minutes: 30 };
  const studied = recordSession(data, { ...base, type: "Teoria" }, addDays(today(), -1));
  const reviewed = recordSession(studied, { ...base, type: "Revisão" });
  assert.equal(dueReviews(reviewed, examId).length, 0);
  const undone = deleteSession(reviewed, reviewed.sessions[0].id);
  assert.equal(dueReviews(undone, examId).length, 1);
});

test("mudar a data da sessão desloca as revisões que ela agendou", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const topic = data.topics[0];
  const studied = recordSession(
    data,
    { examId, subjectId: topic.subjectId, topicId: topic.id, type: "Teoria", minutes: 30 },
    "2026-11-10",
  );
  const moved = updateSession(studied, studied.sessions[0].id, { date: "2026-11-05", minutes: 45 });
  assert.equal(moved.sessions[0].minutes, 45);
  assert.deepEqual(
    moved.reviews.map((r) => r.dueDate),
    ["2026-11-06", "2026-11-12", "2026-12-05"],
  );
});

test("o aproveitamento considera só as últimas 6 semanas", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  data.subjects = data.subjects.slice(0, 2);
  data.topics = [];
  data.exams[0] = { ...data.exams[0], hoursPerWeek: 10 };
  const badSession = (date: string) => ({
    id: date,
    examId,
    subjectId: data.subjects[0].id,
    topicId: "t",
    type: "Questões" as const,
    minutes: 30,
    date,
    questions: 10,
    correct: 1,
  });
  const reference = "2026-11-12";
  const old = { ...data, sessions: [badSession(addDays(reference, -42))] };
  const recent = { ...data, sessions: [badSession(addDays(reference, -41))] };
  const [oldFirst, oldSecond] = weeklyAllocation(old, examId, reference);
  const [recentFirst, recentSecond] = weeklyAllocation(recent, examId, reference);
  assert.equal(oldFirst.minutes, oldSecond.minutes);
  assert.ok(recentFirst.minutes > recentSecond.minutes);
});

test("a meta da semana fica estável depois de salva", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const saved = ensureWeekTarget(data, examId);
  assert.equal(saved.weekTargets.length, 1);
  assert.equal(ensureWeekTarget(saved, examId), saved);
  const changed: AppData = {
    ...saved,
    exams: saved.exams.map((e) => ({ ...e, hoursPerWeek: 5 })),
  };
  assert.equal(weekSummary(changed, examId, currentWeekStart()).targetMinutes, 25 * 60);
  assert.equal(weekSummary(data, examId, currentWeekStart()).targetMinutes, 25 * 60);
  assert.equal(weekSummary(changed, examId, addDays(currentWeekStart(), -7)).targetMinutes, 5 * 60);
});

test("dois retratos da mesma semana resolvem para o de menor id", () => {
  const data = createSeed();
  const examId = data.activeExamId!;
  const weekStart = currentWeekStart();
  const target = (id: string, totalMinutes: number) => ({
    id,
    examId,
    weekStart,
    totalMinutes,
    subjects: [],
  });
  const both = { ...data, weekTargets: [target("b", 300), target("a", 600)] };
  assert.equal(weekSummary(both, examId, weekStart).targetMinutes, 600);
});
