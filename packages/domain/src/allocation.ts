import { addDays, daysUntil, today } from "./dates";
import { isReviewDone } from "./reviews";
import { studiedTopicIds, subjectsInOrder } from "./topics";
import type { AppData, Subject } from "./types";

/** Janela de aproveitamento: um começo ruim não pesa para sempre. */
export const ACCURACY_WINDOW_DAYS = 42;

/**
 * Reta final: nos últimos dias antes da prova, revisões e questões ganham
 * mais espaço. Fora dela, valem os números normais.
 */
export const FINAL_STRETCH = {
  days: 30,
  normal: { reviewMinutes: 20, reviewShare: 0.25, maxAccuracyBoost: 0.2 },
  final: { reviewMinutes: 30, reviewShare: 0.4, maxAccuracyBoost: 0.35 },
} as const;

/** Está na reta final (prova marcada daqui a no máximo 30 dias)? */
export function inFinalStretch(examDate: string | undefined, date: string): boolean {
  if (!examDate) return false;
  const days = daysUntil(examDate, date);
  return days >= 0 && days <= FINAL_STRETCH.days;
}

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

/**
 * Minutos semanais de cada matéria. O peso do edital é ajustado pelo
 * aproveitamento nas questões das últimas 6 semanas, pelos assuntos ainda não
 * estudados e pelas revisões vencidas. A soma é sempre a meta semanal.
 */
export function weeklyAllocation(
  data: AppData,
  examId: string,
  date = today(),
): SubjectAllocation[] {
  const exam = data.exams.find((item) => item.id === examId);
  const subjects = subjectsInOrder(data, examId);
  if (!exam || !subjects.length) return [];

  const totalMinutes = Math.round(exam.hoursPerWeek * 60);
  const due = data.reviews.filter(
    (item) =>
      item.examId === examId && !isReviewDone(item) && item.dueDate <= date,
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
  const rules = inFinalStretch(exam.examDate, date) ? FINAL_STRETCH.final : FINAL_STRETCH.normal;
  const reviewBudget = Math.min(
    totalReviews * rules.reviewMinutes,
    Math.round(totalMinutes * rules.reviewShare),
  );
  const baseBudget = totalMinutes - reviewBudget;

  const studied = studiedTopicIds(data);
  const windowStart = addDays(date, -ACCURACY_WINDOW_DAYS);
  const scores = subjects.map((subject) => {
    const questions = data.sessions.filter(
      (session) =>
        session.examId === examId &&
        session.subjectId === subject.id &&
        session.date > windowStart &&
        session.date <= date,
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
      ? Math.min(rules.maxAccuracyBoost, Math.max(0, (0.7 - correct / asked) * 0.5))
      : 0;
    const topics = data.topics.filter(
      (topic) => topic.subjectId === subject.id,
    );
    const coverageBoost = topics.length
      ? (topics.filter((topic) => !studied.has(topic.id)).length / topics.length) * 0.1
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
