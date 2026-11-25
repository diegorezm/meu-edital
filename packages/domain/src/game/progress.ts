import { addDays, today, weekStartOf } from "../dates";
import { studiedTopicIds } from "../topics";
import type { AppData, WeekTarget } from "../types";
import { ACCURACY_WINDOW_DAYS } from "../allocation";

/**
 * Ofensiva: semanas seguidas com a meta batida, contando para trás a partir
 * da última semana fechada. A semana atual entra quando a meta já foi batida;
 * se ainda não, ela não quebra a sequência. Faltar um dia nunca pune.
 */
export function weeklyStreak(data: AppData, examId: string, date = today()) {
  const exam = data.exams.find((e) => e.id === examId);
  const defaultTarget = Math.round((exam?.hoursPerWeek || 0) * 60);
  const minutesByWeek = new Map<string, number>();
  let first = date;
  for (const session of data.sessions) {
    if (session.examId !== examId) continue;
    if (session.date < first) first = session.date;
    const ws = weekStartOf(session.date);
    minutesByWeek.set(ws, (minutesByWeek.get(ws) ?? 0) + session.minutes);
  }
  const targetByWeek = new Map<string, WeekTarget>();
  for (const target of data.weekTargets) {
    if (target.examId !== examId) continue;
    const prev = targetByWeek.get(target.weekStart);
    if (!prev || target.id.localeCompare(prev.id) < 0) targetByWeek.set(target.weekStart, target);
  }
  const met = (weekStart: string) => {
    const targetMinutes = targetByWeek.get(weekStart)?.totalMinutes ?? defaultTarget;
    return targetMinutes > 0 && (minutesByWeek.get(weekStart) ?? 0) >= targetMinutes;
  };
  const current = weekStartOf(date);
  const currentMet = met(current);
  let streak = currentMet ? 1 : 0;
  const firstWeek = weekStartOf(first);
  for (let week = addDays(current, -7); week >= firstWeek; week = addDays(week, -7)) {
    if (!met(week)) break;
    streak += 1;
  }
  return { weeks: streak, currentWeekMet: currentMet };
}

/** Dias com estudo na semana de `date` e no total. Só informativo. */
export function studyDays(data: AppData, examId: string, date = today()) {
  const days = new Set(data.sessions.filter((s) => s.examId === examId).map((s) => s.date));
  const start = weekStartOf(date);
  const end = addDays(start, 6);
  return {
    thisWeek: [...days].filter((d) => d >= start && d <= end).length,
    total: days.size,
  };
}

export type SubjectLevel = {
  subjectId: string;
  /** De 1 a 5. */
  stars: number;
  coverage: number;
  /** Aproveitamento nas últimas 6 semanas, de 0 a 1; null sem questões. */
  accuracy: number | null;
};

/**
 * Nível da matéria em estrelas, de 1 a 5. Sobe com assuntos estudados
 * (60%) e acertos nas últimas 6 semanas (40%). Sem questões, vale só a
 * cobertura.
 */
export function subjectLevels(data: AppData, examId: string, date = today()): SubjectLevel[] {
  const studied = studiedTopicIds(data);
  const windowStart = addDays(date, -ACCURACY_WINDOW_DAYS);
  return data.subjects
    .filter((s) => s.examId === examId)
    .map((subject) => {
      const topics = data.topics.filter((t) => t.subjectId === subject.id);
      const coverage = topics.length
        ? topics.filter((t) => studied.has(t.id)).length / topics.length
        : 0;
      const recent = data.sessions.filter(
        (s) => s.subjectId === subject.id && s.date > windowStart && s.date <= date,
      );
      const questions = recent.reduce((sum, s) => sum + (s.questions ?? 0), 0);
      const correct = recent.reduce((sum, s) => sum + (s.correct ?? 0), 0);
      const accuracy = questions ? Math.min(1, correct / questions) : null;
      const score = accuracy === null ? coverage : 0.6 * coverage + 0.4 * accuracy;
      return {
        subjectId: subject.id,
        stars: Math.min(5, 1 + Math.floor(score * 5)),
        coverage,
        accuracy,
      };
    });
}
