import type { AppData, Day } from "@domain/types";

export function getWeekPlan(data: AppData, examId: string, weekStart: string) {
  return data.planned.filter(
    (item) => item.examId === examId && item.weekStart === weekStart,
  );
}

export function getDayPlan(
  data: AppData,
  examId: string,
  weekStart: string,
  day: Day,
) {
  return getWeekPlan(data, examId, weekStart)
    .filter((item) => item.day === day)
    .sort((a, b) => a.order - b.order);
}

export function removePlannedSession(data: AppData, id: string): AppData {
  return { ...data, planned: data.planned.filter((item) => item.id !== id) };
}
