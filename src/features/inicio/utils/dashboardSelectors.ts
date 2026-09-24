import type { AppData } from "@domain/types";
import { mondayOf, today } from "@domain/types";

export function getTodayPlan(data: AppData, examId: string, date = new Date()) {
  const day = (date.getDay() + 6) % 7;
  const weekStart = mondayOf(date).toISOString().slice(0, 10);
  return data.planned
    .filter(
      (item) =>
        item.examId === examId &&
        item.weekStart === weekStart &&
        item.day === day,
    )
    .sort((a, b) => a.order - b.order);
}

export function getDueReviews(data: AppData, examId: string) {
  return data.reviews
    .filter(
      (item) =>
        item.examId === examId && !item.completed && item.dueDate <= today(),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getTopicPerformance(data: AppData, examId: string) {
  const subjectIds = new Set(
    data.subjects
      .filter((item) => item.examId === examId)
      .map((item) => item.id),
  );
  const totals = new Map<
    string,
    { count: number; questions: number; correct: number }
  >();
  for (const session of data.sessions) {
    const current = totals.get(session.topicId) || {
      count: 0,
      questions: 0,
      correct: 0,
    };
    current.count += 1;
    current.questions += session.questions || 0;
    current.correct += session.correct || 0;
    totals.set(session.topicId, current);
  }
  return data.topics
    .filter((item) => subjectIds.has(item.subjectId))
    .map((topic) => {
      const { count, questions, correct } = totals.get(topic.id) || {
        count: 0,
        questions: 0,
        correct: 0,
      };
      return {
        topic,
        rate: questions ? Math.round((100 * correct) / questions) : null,
        count,
      };
    });
}
