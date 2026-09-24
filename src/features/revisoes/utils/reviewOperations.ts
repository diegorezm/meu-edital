import type { AppData, Review } from "@domain/types";

export function getOpenReviews(data: AppData) {
  return data.reviews
    .filter((item) => item.examId === data.activeExamId && !item.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function splitReviews(reviews: Review[], date: string) {
  return {
    due: reviews.filter((item) => item.dueDate <= date),
    later: reviews.filter((item) => item.dueDate > date),
  };
}

export function parseReviewOffsets(input: string): number[] | null {
  const values = input.split(",").map((value) => Number(value.trim()));
  return values.length &&
    values.every(
      (value, index) =>
        Number.isInteger(value) &&
        value > 0 &&
        (index === 0 || value > values[index - 1]),
    )
    ? values
    : null;
}

export function completeReview(data: AppData, id: string): AppData {
  return {
    ...data,
    reviews: data.reviews.map((item) =>
      item.id === id ? { ...item, completed: true } : item,
    ),
  };
}
export function saveReviewOffsets(data: AppData, offsets: number[]): AppData {
  return { ...data, reviewOffsets: offsets };
}
