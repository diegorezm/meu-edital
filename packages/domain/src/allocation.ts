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
  const topicSubject = new Map(data.topics.map((topic) => [topic.id, topic.subjectId]));
  const topicsBySubject = new Map<string, string[]>();
  for (const topic of data.topics) {
    const list = topicsBySubject.get(topic.subjectId) ?? [];
    list.push(topic.id);
    topicsBySubject.set(topic.subjectId, list);
  }
  const due = data.reviews.filter(
    (item) =>
      item.examId === examId && !isReviewDone(item) && item.dueDate <= date,
  );
  const reviewCount = new Map<string, number>();
  for (const review of due) {
    const subjectId = topicSubject.get(review.topicId);
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
  const qaBySubject = new Map<string, { asked: number; correct: number }>();
  for (const session of data.sessions) {
    if (session.examId !== examId || session.date <= windowStart || session.date > date) continue;
    const entry = qaBySubject.get(session.subjectId) ?? { asked: 0, correct: 0 };
    entry.asked += session.questions || 0;
    entry.correct += session.correct || 0;
    qaBySubject.set(session.subjectId, entry);
  }
  const scores = subjects.map((subject) => {
    const qa = qaBySubject.get(subject.id);
    const accuracyBoost =
      qa && qa.asked
        ? Math.min(rules.maxAccuracyBoost, Math.max(0, (0.7 - qa.correct / qa.asked) * 0.5))
        : 0;
    const topicIds = topicsBySubject.get(subject.id) ?? [];
    const coverageBoost = topicIds.length
      ? (topicIds.filter((id) => !studied.has(id)).length / topicIds.length) * 0.1
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
        let donor = -1;
        for (let d = 0; d < minutes.length; d += 1) {
          if (d !== index && minutes[d] > 30 && (donor < 0 || minutes[d] > minutes[donor]))
            donor = d;
        }
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
