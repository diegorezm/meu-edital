import type { AppData, PlannedSession, Subject } from "./types";
import { today } from "./types";

export type SubjectAllocation = {
  subjectId: string;
  name: string;
  weight: number;
  minutes: number;
  reviewMinutes: number;
};

export function subjectWeight(subject: Subject): number {
  if (
    subject.questions &&
    subject.questions > 0 &&
    subject.pointsPerQuestion &&
    subject.pointsPerQuestion > 0
  )
    return subject.questions * subject.pointsPerQuestion;
  return subject.weight && subject.weight > 0 ? subject.weight : 1;
}

export function weeklyAllocation(
  data: AppData,
  examId: string,
): SubjectAllocation[] {
  const exam = data.exams.find((item) => item.id === examId);
  const subjects = data.subjects.filter((item) => item.examId === examId);
  if (!exam || !subjects.length) return [];

  const totalMinutes = Math.round(exam.hoursPerWeek * 60);
  const due = data.reviews.filter(
    (item) =>
      item.examId === examId && !item.completed && item.dueDate <= today(),
  );
  const reviewCount = new Map<string, number>();
  for (const review of due) {
    const subjectId = data.topics.find(
      (topic) => topic.id === review.topicId,
    )?.subjectId;
    if (subjectId)
      reviewCount.set(subjectId, (reviewCount.get(subjectId) || 0) + 1);
  }
  const totalReviews = subjects.reduce(
    (sum, subject) => sum + (reviewCount.get(subject.id) || 0),
    0,
  );
  const reviewBudget = Math.min(
    totalReviews * 20,
    Math.round(totalMinutes * 0.25),
  );
  const baseBudget = totalMinutes - reviewBudget;

  const scores = subjects.map((subject) => {
    const questions = data.sessions.filter(
      (session) =>
        session.examId === examId && session.subjectId === subject.id,
    );
    const asked = questions.reduce(
      (sum, session) => sum + (session.questions || 0),
      0,
    );
    const correct = questions.reduce(
      (sum, session) => sum + (session.correct || 0),
      0,
    );
    const accuracyBoost = asked
      ? Math.min(0.2, Math.max(0, (0.7 - correct / asked) * 0.5))
      : 0;
    const topics = data.topics.filter(
      (topic) => topic.subjectId === subject.id,
    );
    const coverageBoost = topics.length
      ? (topics.filter((topic) => !topic.studied).length / topics.length) * 0.1
      : 0;
    return subjectWeight(subject) * (1 + accuracyBoost + coverageBoost);
  });
  const scoreSum = scores.reduce((sum, score) => sum + score, 0);
  const reviewAllocations = subjects.map((subject) =>
    totalReviews
      ? (reviewBudget * (reviewCount.get(subject.id) || 0)) / totalReviews
      : 0,
  );
  const exact = subjects.map(
    (_, index) =>
      (baseBudget * scores[index]) / scoreSum + reviewAllocations[index],
  );
  const minutes = exact.map(Math.floor);
  let remainder = totalMinutes - minutes.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - minutes[index] }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const item of order) {
    if (remainder-- <= 0) break;
    minutes[item.index] += 1;
  }
  if (totalMinutes >= subjects.length * 30) {
    for (let index = 0; index < minutes.length; index += 1) {
      while (minutes[index] < 30) {
        const donor = minutes.findIndex(
          (value, donorIndex) => donorIndex !== index && value > 30,
        );
        if (donor < 0) break;
        minutes[donor] -= 1;
        minutes[index] += 1;
      }
    }
  }
  return subjects.map((subject, index) => ({
    subjectId: subject.id,
    name: subject.name,
    weight: subjectWeight(subject),
    minutes: minutes[index],
    reviewMinutes: Math.round(reviewAllocations[index]),
  }));
}

export function weeklyPlanBalance(
  allocation: SubjectAllocation[],
  sessions: PlannedSession[],
) {
  const planned = new Map<string, number>();
  for (const session of sessions) {
    planned.set(
      session.subjectId,
      (planned.get(session.subjectId) || 0) + session.minutes,
    );
  }
  const rows = allocation.map((item) => ({
    ...item,
    plannedMinutes: planned.get(item.subjectId) || 0,
    outsideTarget:
      Math.abs((planned.get(item.subjectId) || 0) - item.minutes) >
      Math.max(30, item.minutes * 0.25),
  }));
  const targetTotal = allocation.reduce((sum, item) => sum + item.minutes, 0);
  const plannedTotal = sessions.reduce(
    (sum, session) => sum + session.minutes,
    0,
  );
  return {
    rows,
    targetTotal,
    plannedTotal,
    outsideTarget:
      rows.some((row) => row.outsideTarget) ||
      Math.abs(plannedTotal - targetTotal) > Math.max(30, targetTotal * 0.1),
  };
}
