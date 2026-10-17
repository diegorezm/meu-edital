import { advanceCycle } from "./cycle";
import type { AppData, StudySession } from "./types";
import { addDays, today, uid } from "./types";

export type SessionInput = Omit<StudySession, "id" | "date">;

/**
 * Registra a sessão, marca o assunto como estudado, agenda revisões na
 * primeira vez que o assunto é estudado, conclui revisões vencidas quando a
 * sessão é de revisão e avança o ciclo quando a sessão veio de um bloco.
 */
export function recordSession(
  data: AppData,
  session: SessionInput,
  date = today(),
): AppData {
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
  const next: AppData = {
    ...data,
    topics: data.topics.map((topic) =>
      topic.id === session.topicId ? { ...topic, studied: true } : topic,
    ),
    sessions: [entry, ...data.sessions],
    reviews: [
      ...data.reviews.map((review) =>
        session.type === "Revisão" &&
        review.topicId === session.topicId &&
        !review.completed &&
        review.dueDate <= date
          ? { ...review, completed: true }
          : review,
      ),
      ...reviews,
    ],
  };
  return session.cycleItemId
    ? advanceCycle(next, session.examId, session.cycleItemId)
    : next;
}

export function validateSession(input: SessionInput): string | null {
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
