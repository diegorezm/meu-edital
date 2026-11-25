import type { AppData } from "./types";

export function removeExam(data: AppData, id: string): AppData {
  const subjectIds = new Set(
    data.subjects.filter((item) => item.examId === id).map((item) => item.id),
  );
  return {
    ...data,
    exams: data.exams.filter((item) => item.id !== id),
    subjects: data.subjects.filter((item) => item.examId !== id),
    topics: data.topics.filter((item) => !subjectIds.has(item.subjectId)),
    sessions: data.sessions.filter((item) => item.examId !== id),
    reviews: data.reviews.filter((item) => item.examId !== id),
    cycle: data.cycle.filter((item) => item.examId !== id),
    weekTargets: data.weekTargets.filter((item) => item.examId !== id),
    mockExams: data.mockExams.filter((item) => item.examId !== id),
    activeExamId:
      data.activeExamId === id
        ? data.exams.find((item) => item.id !== id)?.id || null
        : data.activeExamId,
  };
}

export function removeSubject(data: AppData, id: string): AppData {
  const subject = data.subjects.find((item) => item.id === id);
  const topicIds = new Set(
    data.topics.filter((item) => item.subjectId === id).map((item) => item.id),
  );
  const removedSessionIds = new Set(
    data.sessions.filter((item) => item.subjectId === id).map((item) => item.id),
  );
  const nextCycle = data.cycle.filter((item) => item.subjectId !== id);
  const examCycleLength = subject
    ? nextCycle.filter((item) => item.examId === subject.examId).length
    : 0;
  return {
    ...data,
    exams: subject
      ? data.exams.map((exam) =>
          exam.id === subject.examId
            ? {
                ...exam,
                cyclePosition: examCycleLength > 0 ? exam.cyclePosition % examCycleLength : 0,
                lastCycleSessionId:
                  exam.lastCycleSessionId && removedSessionIds.has(exam.lastCycleSessionId)
                    ? undefined
                    : exam.lastCycleSessionId,
              }
            : exam,
        )
      : data.exams,
    subjects: data.subjects.filter((item) => item.id !== id),
    topics: data.topics.filter((item) => item.subjectId !== id),
    sessions: data.sessions.filter((item) => item.subjectId !== id),
    cycle: nextCycle,
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
  const removedSessionIds = new Set(
    data.sessions.filter((item) => ids.has(item.topicId)).map((item) => item.id),
  );
  return {
    ...data,
    exams: removedSessionIds.size
      ? data.exams.map((exam) =>
          exam.lastCycleSessionId && removedSessionIds.has(exam.lastCycleSessionId)
            ? { ...exam, lastCycleSessionId: undefined }
            : exam,
        )
      : data.exams,
    topics: data.topics.filter((item) => !ids.has(item.id)),
    sessions: data.sessions.filter((item) => !ids.has(item.topicId)),
    reviews: data.reviews.filter((item) => !ids.has(item.topicId)),
  };
}
