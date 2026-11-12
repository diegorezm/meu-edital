import { advanceCycle, getCycleItems } from "./cycle";
import { addDays, daysUntil, today } from "./dates";
import { uid } from "./ids";
import { isReviewDone } from "./reviews";
import type { AppData, Review, StudySession } from "./types";

export type SessionInput = Omit<StudySession, "id" | "date">;

/** Campos que podem ser corrigidos depois do registro. */
export type SessionChange = Partial<
  Pick<StudySession, "minutes" | "questions" | "correct" | "note" | "date">
>;

/**
 * Registra a sessão. É a única forma de salvar estudo: agenda revisões na
 * primeira vez que o assunto é estudado, conclui revisões vencidas quando a
 * sessão é de revisão e avança o ciclo quando a sessão veio de um bloco.
 */
export function recordSession(
  data: AppData,
  session: SessionInput,
  date = today(),
): AppData {
  const entry: StudySession = { ...session, id: uid(), date };
  const alreadyStudied = data.sessions.some((s) => s.topicId === session.topicId);
  const reviews: Review[] =
    !alreadyStudied && session.type !== "Revisão"
      ? data.reviewOffsets.map((offset, stage) => ({
          id: uid(),
          examId: session.examId,
          topicId: session.topicId,
          sessionId: entry.id,
          dueDate: addDays(date, offset),
          stage: stage + 1,
        }))
      : [];
  const next: AppData = {
    ...data,
    sessions: [entry, ...data.sessions],
    reviews: [
      ...data.reviews.map((review) =>
        session.type === "Revisão" &&
        review.topicId === session.topicId &&
        !isReviewDone(review) &&
        review.dueDate <= date
          ? { ...review, completedBySessionId: entry.id }
          : review,
      ),
      ...reviews,
    ],
  };
  if (!session.cycleItemId) return next;
  const advanced = advanceCycle(next, session.examId, session.cycleItemId);
  return advanced === next
    ? next
    : {
        ...advanced,
        exams: advanced.exams.map((exam) =>
          exam.id === session.examId ? { ...exam, lastCycleSessionId: entry.id } : exam,
        ),
      };
}

/**
 * Corrige uma sessão. Mudar a data desloca as revisões que ela agendou pelo
 * mesmo número de dias. Matéria, assunto, tipo e bloco não mudam: para isso,
 * exclua e registre de novo.
 */
export function updateSession(
  data: AppData,
  id: string,
  change: SessionChange,
): AppData {
  const current = data.sessions.find((s) => s.id === id);
  if (!current) return data;
  const updated = { ...current, ...change };
  const shift = change.date ? daysUntil(change.date, current.date) : 0;
  return {
    ...data,
    sessions: data.sessions.map((s) => (s.id === id ? updated : s)),
    reviews: shift
      ? data.reviews.map((review) =>
          review.sessionId === id
            ? { ...review, dueDate: addDays(review.dueDate, shift) }
            : review,
        )
      : data.reviews,
  };
}

/**
 * Exclui uma sessão e desfaz os efeitos dela: o assunto volta a não estudado
 * se não houver outra sessão, as revisões que ela agendou somem, as que ela
 * concluiu reabrem e, se foi a última a avançar o ciclo, a jornada volta ao
 * bloco dela.
 */
export function deleteSession(data: AppData, id: string): AppData {
  const session = data.sessions.find((s) => s.id === id);
  if (!session) return data;
  const next: AppData = {
    ...data,
    sessions: data.sessions.filter((s) => s.id !== id),
    reviews: data.reviews
      .filter((review) => review.sessionId !== id)
      .map((review) =>
        review.completedBySessionId === id
          ? { ...review, completedBySessionId: undefined }
          : review,
      ),
  };
  const exam = next.exams.find((e) => e.id === session.examId);
  if (!exam || exam.lastCycleSessionId !== id || !session.cycleItemId) return next;
  const items = getCycleItems(next, exam.id);
  const index = items.findIndex((item) => item.id === session.cycleItemId);
  const completedLap = index === items.length - 1 && exam.cyclePosition === 0;
  return {
    ...next,
    exams: next.exams.map((e) =>
      e.id === exam.id
        ? {
            ...e,
            lastCycleSessionId: undefined,
            ...(index >= 0
              ? {
                  cyclePosition: index,
                  cycleLaps: Math.max(0, e.cycleLaps - (completedLap ? 1 : 0)),
                }
              : {}),
          }
        : e,
    ),
  };
}

export function validateSession(input: SessionInput): string | null {
  if (!input.subjectId || !input.topicId)
    return "Selecione uma matéria e um assunto.";
  if (!Number.isFinite(input.minutes) || input.minutes < 1)
    return "A duração deve ser maior que zero.";
  if ((input.questions ?? 0) < 0 || (input.correct ?? 0) < 0)
    return "Questões e acertos não podem ser negativos.";
  if ((input.questions ?? 0) < (input.correct ?? 0))
    return "Acertos não podem superar o número de questões.";
  return null;
}
