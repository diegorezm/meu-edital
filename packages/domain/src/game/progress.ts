import { addDays, today, weekStartOf } from "../dates";
import { studiedTopicIds } from "../topics";
import type { AppData } from "../types";
import { ACCURACY_WINDOW_DAYS } from "../allocation";
import { weekSummary } from "../tracking";

/**
 * Ofensiva: semanas seguidas com a meta batida, contando para trás a partir
 * da última semana fechada. A semana atual entra quando a meta já foi batida;
 * se ainda não, ela não quebra a sequência. Faltar um dia nunca pune.
 */
export function weeklyStreak(data: AppData, examId: string, date = today()) {
  const met = (weekStart: string) => {
    const week = weekSummary(data, examId, weekStart);
    return week.targetMinutes > 0 && week.minutes >= week.targetMinutes;
  };
  const current = weekStartOf(date);
  const currentMet = met(current);
  let streak = currentMet ? 1 : 0;
  const first = data.sessions
    .filter((s) => s.examId === examId)
    .reduce((min, s) => (s.date < min ? s.date : min), date);
  for (let week = addDays(current, -7); week >= weekStartOf(first); week = addDays(week, -7)) {
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
