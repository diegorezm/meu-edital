import { weeklyAllocation } from "./allocation";
import { today, weekStartOf } from "./dates";
import { uid } from "./ids";
import type { AppData, WeekTarget } from "./types";

/**
 * Retrato salvo da semana. Dois aparelhos offline podem salvar o mesmo
 * retrato; vale o de menor id, que é o criado primeiro.
 */
export function savedWeekTarget(
  data: AppData,
  examId: string,
  weekStart: string,
): WeekTarget | undefined {
  return data.weekTargets
    .filter((t) => t.examId === examId && t.weekStart === weekStart)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
}

/** Meta calculada agora, a partir da meta e dos pesos atuais. */
export function computeWeekTarget(
  data: AppData,
  examId: string,
  weekStart: string,
  date = today(),
): Omit<WeekTarget, "id"> {
  const exam = data.exams.find((e) => e.id === examId);
  const allocation = weeklyAllocation(data, examId, date);
  return {
    examId,
    weekStart,
    totalMinutes: Math.round((exam?.hoursPerWeek || 0) * 60),
    subjects: allocation.map((a) => ({ subjectId: a.subjectId, minutes: a.minutes })),
  };
}

/**
 * Meta da semana: o retrato salvo, quando existe. Semanas passadas sem
 * retrato (anteriores a esta regra) e a semana atual ainda sem retrato usam a
 * meta de agora.
 */
export function weekTargetFor(
  data: AppData,
  examId: string,
  weekStart: string,
): Omit<WeekTarget, "id"> {
  return savedWeekTarget(data, examId, weekStart) || computeWeekTarget(data, examId, weekStart);
}

/** Salva o retrato da semana de `date`, se ainda não existir. Chame ao abrir o app e ao registrar estudo. */
export function ensureWeekTarget(data: AppData, examId: string, date = today()): AppData {
  const weekStart = weekStartOf(date);
  if (!data.exams.some((e) => e.id === examId)) return data;
  if (savedWeekTarget(data, examId, weekStart)) return data;
  return {
    ...data,
    weekTargets: [
      ...data.weekTargets,
      { id: uid(), ...computeWeekTarget(data, examId, weekStart, date) },
    ],
  };
}
