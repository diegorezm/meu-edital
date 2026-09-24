import type { AppData } from "@domain/types";

export function removeExam(data: AppData, id: string): AppData {
  const subjectIds = new Set(
    data.subjects.filter((item) => item.examId === id).map((item) => item.id),
  );
  return {
    ...data,
    exams: data.exams.filter((item) => item.id !== id),
    subjects: data.subjects.filter((item) => item.examId !== id),
    topics: data.topics.filter((item) => !subjectIds.has(item.subjectId)),
    planned: data.planned.filter((item) => item.examId !== id),
    sessions: data.sessions.filter((item) => item.examId !== id),
    reviews: data.reviews.filter((item) => item.examId !== id),
    cycle: data.cycle.filter((item) => item.examId !== id),
    activeExamId:
      data.activeExamId === id
        ? data.exams.find((item) => item.id !== id)?.id || null
        : data.activeExamId,
  };
}

export function removeSubject(data: AppData, id: string): AppData {
  const topicIds = new Set(
    data.topics.filter((item) => item.subjectId === id).map((item) => item.id),
  );
  return {
    ...data,
    subjects: data.subjects.filter((item) => item.id !== id),
    topics: data.topics.filter((item) => item.subjectId !== id),
    planned: data.planned.filter((item) => item.subjectId !== id),
    sessions: data.sessions.filter((item) => item.subjectId !== id),
    cycle: data.cycle.filter((item) => item.subjectId !== id),
    reviews: data.reviews.filter((item) => !topicIds.has(item.topicId)),
  };
}

export function removeTopicTree(data: AppData, id: string): AppData {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of data.topics) {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    }
  }
  return {
    ...data,
    topics: data.topics.filter((item) => !ids.has(item.id)),
    planned: data.planned.filter((item) => !ids.has(item.topicId)),
    sessions: data.sessions.filter((item) => !ids.has(item.topicId)),
    reviews: data.reviews.filter((item) => !ids.has(item.topicId)),
    cycle: data.cycle.filter((item) => !ids.has(item.topicId)),
  };
}
