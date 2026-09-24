import type { AppData, StudySession } from "@domain/types";
import { addDays, today, uid } from "@domain/types";

export function recordSession(
  data: AppData,
  session: Omit<StudySession, "id" | "date">,
  plannedId?: string,
): AppData {
  const date = today();
  const entry: StudySession = { ...session, id: uid(), date };
  const alreadyStudied = data.topics.find(
    (topic) => topic.id === session.topicId,
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
    topics: data.topics.map((topic) =>
      topic.id === session.topicId ? { ...topic, studied: true } : topic,
    ),
    sessions: [entry, ...data.sessions],
    reviews: [...data.reviews, ...reviews],
    planned: data.planned.map((planned) =>
      planned.id === plannedId ? { ...planned, completed: true } : planned,
    ),
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
