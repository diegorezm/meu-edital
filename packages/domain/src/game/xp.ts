import { addDays, today, weekStartOf } from "../dates";
import { weekSummary } from "../tracking";
import type { AppData, StudySession } from "../types";
import { LIMITS, XP } from "./constants";

/**
 * Minutos que contam para o XP de cada sessão, depois dos limites de
 * sanidade: no máximo 6 h por sessão e 16 h por dia (as sessões do dia são
 * contadas na ordem em que foram criadas).
 */
export function countedMinutes(sessions: StudySession[]): Map<string, number> {
  const byDay = new Map<string, number>();
  const counted = new Map<string, number>();
  const ordered = [...sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  for (const session of ordered) {
    const used = byDay.get(session.date) ?? 0;
    const minutes = Math.max(
      0,
      Math.min(session.minutes, LIMITS.sessionMinutes, LIMITS.dayMinutes - used),
    );
    byDay.set(session.date, used + minutes);
    counted.set(session.id, minutes);
  }
  return counted;
}

/** XP de uma sessão isolada: minutos (até 6 h) e acertos. Para mostrar ao registrar. */
export function sessionXp(session: Pick<StudySession, "minutes" | "correct">): number {
  return (
    Math.min(session.minutes, LIMITS.sessionMinutes) * XP.perMinute +
    Math.max(0, session.correct ?? 0) * XP.perCorrect
  );
}

/** Revisões concluídas até o dia do vencimento. */
export function reviewsOnTime(data: AppData): number {
  const dates = new Map(data.sessions.map((s) => [s.id, s.date]));
  return data.reviews.filter((review) => {
    const done = review.completedBySessionId && dates.get(review.completedBySessionId);
    return done && done <= review.dueDate;
  }).length;
}

/** Semanas (por concurso) com a meta batida, até a semana de `date`. */
export function weeksWithGoal(data: AppData, date = today()): { examId: string; weekStart: string }[] {
  const result: { examId: string; weekStart: string }[] = [];
  const lastWeek = weekStartOf(date);
  for (const exam of data.exams) {
    const dates = data.sessions.filter((s) => s.examId === exam.id).map((s) => s.date);
    if (!dates.length) continue;
    let week = weekStartOf(dates.reduce((min, d) => (d < min ? d : min)));
    for (; week <= lastWeek; week = addDays(week, 7)) {
      const summary = weekSummary(data, exam.id, week);
      if (summary.targetMinutes > 0 && summary.minutes >= summary.targetMinutes)
        result.push({ examId: exam.id, weekStart: week });
    }
  }
  return result;
}

export type XpBreakdown = {
  minutes: number;
  correct: number;
  reviews: number;
  laps: number;
  weeks: number;
  total: number;
};

/** XP do jogador, somando todas as regras da tabela. Sempre derivado. */
export function playerXp(data: AppData, date = today()): XpBreakdown {
  const counted = countedMinutes(data.sessions);
  const minutes = [...counted.values()].reduce((sum, m) => sum + m, 0) * XP.perMinute;
  const correct =
    data.sessions.reduce(
      (sum, s) => sum + Math.max(0, Math.min(s.correct ?? 0, s.questions ?? s.correct ?? 0)),
      0,
    ) * XP.perCorrect;
  const reviews = reviewsOnTime(data) * XP.reviewOnTime;
  const laps = data.exams.reduce((sum, e) => sum + e.cycleLaps, 0) * XP.lap;
  const weeks = weeksWithGoal(data, date).length * XP.weekGoal;
  return { minutes, correct, reviews, laps, weeks, total: minutes + correct + reviews + laps + weeks };
}
