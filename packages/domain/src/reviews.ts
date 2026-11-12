import { today } from "./dates";
import type { AppData, Review } from "./types";

export const isReviewDone = (review: Review) => Boolean(review.completedBySessionId);

/** Revisões pendentes até `date`, das mais antigas para as mais novas. */
export function dueReviews(data: AppData, examId: string, date = today()) {
  return data.reviews
    .filter((r) => r.examId === examId && !isReviewDone(r) && r.dueDate <= date)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function reviewTopicName(data: AppData, review: Review) {
  return data.topics.find((t) => t.id === review.topicId)?.name || "Assunto";
}
