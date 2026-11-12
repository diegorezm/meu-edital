import { addDays, today } from "../dates";
import { ACCURACY_WINDOW_DAYS } from "../allocation";
import { cycleState, getCycleItems } from "../cycle";
import { subjectCoverage } from "../tracking";
import type { AppData } from "../types";
import { CONTRACTS, XP } from "./constants";

export type ContractKind = "block" | "reviews" | "newTopic" | "questions";

export type Contract = {
  /** Estável no dia: `AAAA-MM-DD:tipo`. */
  id: string;
  kind: ContractKind;
  title: string;
  subjectId?: string;
  target: number;
  progress: number;
  done: boolean;
  /** XP que esse estudo costuma render, para mostrar no selo. */
  rewardXp: number;
};

/**
 * Os três contratos do dia, gerados do que o estudante mais precisa. São
 * cumpridos pelo estudo registrado no dia, nunca por clique, e calculados
 * com o estado de antes do dia para não mudarem enquanto ele estuda:
 * 1. concluir um bloco da jornada;
 * 2. fazer as revisões que já estavam vencidas, ou estudar um assunto novo;
 * 3. resolver questões na matéria mais fraca.
 */
export function dailyContracts(data: AppData, examId: string, date = today()): Contract[] {
  const exam = data.exams.find((e) => e.id === examId);
  if (!exam || !getCycleItems(data, examId).length) return [];
  const before = data.sessions.filter((s) => s.examId === examId && s.date < date);
  const todays = data.sessions.filter((s) => s.examId === examId && s.date === date);
  const id = (kind: ContractKind) => `${date}:${kind}`;
  const contracts: Contract[] = [];

  // 1. Jornada.
  const blocks = todays.filter((s) => s.cycleItemId).length;
  const nextMinutes = cycleState(data, examId).next?.minutes ?? 60;
  contracts.push({
    id: id("block"),
    kind: "block",
    title: "Concluir 1 bloco da jornada",
    target: 1,
    progress: Math.min(1, blocks),
    done: blocks >= 1,
    rewardXp: nextMinutes * XP.perMinute,
  });

  // 2. Revisões vencidas no começo do dia, ou um assunto novo.
  const beforeIds = new Set(before.map((s) => s.id));
  const dueAtStart = data.reviews.filter(
    (r) =>
      r.examId === examId &&
      r.dueDate <= date &&
      !(r.completedBySessionId && beforeIds.has(r.completedBySessionId)),
  );
  const todayIds = new Set(todays.map((s) => s.id));
  if (dueAtStart.length) {
    const target = Math.min(CONTRACTS.reviews, dueAtStart.length);
    const done = dueAtStart.filter(
      (r) => r.completedBySessionId && todayIds.has(r.completedBySessionId),
    ).length;
    contracts.push({
      id: id("reviews"),
      kind: "reviews",
      title: target === 1 ? "Fazer 1 revisão vencida" : `Fazer ${target} revisões vencidas`,
      target,
      progress: Math.min(target, done),
      done: done >= target,
      rewardXp: target * XP.reviewOnTime,
    });
  } else {
    const studiedBefore = new Set(before.map((s) => s.topicId));
    const fresh = todays.some((s) => !studiedBefore.has(s.topicId) && s.type !== "Revisão");
    contracts.push({
      id: id("newTopic"),
      kind: "newTopic",
      title: "Estudar 1 assunto novo",
      target: 1,
      progress: fresh ? 1 : 0,
      done: fresh,
      rewardXp: 30 * XP.perMinute,
    });
  }

  // 3. Questões na matéria mais fraca.
  const weakest = weakestSubject(data, examId, date);
  if (weakest) {
    const answered = todays
      .filter((s) => s.subjectId === weakest.id)
      .reduce((sum, s) => sum + (s.questions ?? 0), 0);
    contracts.push({
      id: id("questions"),
      kind: "questions",
      subjectId: weakest.id,
      title: `${CONTRACTS.questions} questões de ${weakest.name}`,
      target: CONTRACTS.questions,
      progress: Math.min(CONTRACTS.questions, answered),
      done: answered >= CONTRACTS.questions,
      rewardXp: Math.round(CONTRACTS.questions * 0.7) * XP.perCorrect,
    });
  }
  return contracts;
}

/**
 * Matéria mais fraca antes do dia: o pior aproveitamento nas últimas 6
 * semanas entre as que têm questões suficientes; sem isso, a de menor
 * cobertura do edital.
 */
export function weakestSubject(data: AppData, examId: string, date = today()) {
  const subjects = data.subjects
    .filter((s) => s.examId === examId)
    .sort((a, b) => a.position - b.position);
  if (!subjects.length) return undefined;
  const windowStart = addDays(date, -ACCURACY_WINDOW_DAYS);
  const scored = subjects.flatMap((subject) => {
    const recent = data.sessions.filter(
      (s) => s.subjectId === subject.id && s.date > windowStart && s.date < date,
    );
    const questions = recent.reduce((sum, s) => sum + (s.questions ?? 0), 0);
    const correct = recent.reduce((sum, s) => sum + (s.correct ?? 0), 0);
    return questions >= CONTRACTS.minQuestionsForAccuracy
      ? [{ subject, accuracy: correct / questions }]
      : [];
  });
  if (scored.length)
    return scored.reduce((worst, item) => (item.accuracy < worst.accuracy ? item : worst)).subject;
  return subjects.reduce((least, subject) =>
    subjectCoverage(data, subject.id).percent < subjectCoverage(data, least.id).percent
      ? subject
      : least,
  );
}
