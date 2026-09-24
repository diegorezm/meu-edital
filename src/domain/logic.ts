import { AppData, StudySession, Topic, addDays, today, uid } from "./types";

export function examProgress(data: AppData, examId: string) {
  const ids = new Set(
    data.subjects.filter((s) => s.examId === examId).map((s) => s.id),
  );
  const topics = data.topics.filter((t) => ids.has(t.subjectId));
  return topics.length
    ? Math.round((100 * topics.filter((t) => t.studied).length) / topics.length)
    : 0;
}

export function recordSession(
  data: AppData,
  session: Omit<StudySession, "id" | "date">,
  plannedId?: string,
): AppData {
  const date = today();
  const entry: StudySession = { ...session, id: uid(), date };
  const alreadyStudied = data.topics.find(
    (t) => t.id === session.topicId,
  )?.studied;
  const reviews =
    !alreadyStudied && session.type !== "Revisão"
      ? data.reviewOffsets.map((offset, stage) => ({
          id: uid(),
          examId: session.examId,
          topicId: session.topicId,
          dueDate: addDays(date, offset),
          completed: false,
          stage: stage + 1,
        }))
      : [];
  return {
    ...data,
    topics: data.topics.map((t: Topic) =>
      t.id === session.topicId ? { ...t, studied: true } : t,
    ),
    sessions: [entry, ...data.sessions],
    reviews: [...data.reviews, ...reviews],
    planned: data.planned.map((p) =>
      p.id === plannedId ? { ...p, completed: true } : p,
    ),
  };
}

export function weeklyStats(data: AppData, examId: string) {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const sessions = data.sessions.filter(
    (s) => s.examId === examId && new Date(`${s.date}T12:00:00`) >= start,
  );
  const minutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const questions = sessions.reduce((sum, s) => sum + (s.questions || 0), 0);
  const correct = sessions.reduce((sum, s) => sum + (s.correct || 0), 0);
  return {
    minutes,
    questions,
    accuracy: questions ? Math.round((100 * correct) / questions) : null,
  };
}

export function validateSession(
  input: Omit<StudySession, "id" | "date">,
): string | null {
  if (!input.subjectId || !input.topicId)
    return "Selecione uma matéria e um assunto.";
  if (!Number.isFinite(input.minutes) || input.minutes < 1)
    return "A duração deve ser maior que zero.";
  if (
    input.type === "Questões" &&
    (input.questions ?? 0) < (input.correct ?? 0)
  )
    return "Acertos não podem superar o número de questões.";
  if ((input.questions ?? 0) < 0 || (input.correct ?? 0) < 0)
    return "Questões e acertos não podem ser negativos.";
  return null;
}
