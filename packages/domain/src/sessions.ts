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
  const adapted = adaptNextReviews(next, entry);
  if (!session.cycleItemId) return adapted;
  const advanced = advanceCycle(adapted, session.examId, session.cycleItemId);
  return advanced === adapted
    ? adapted
    : {
        ...advanced,
        exams: advanced.exams.map((exam) =>
          exam.id === session.examId ? { ...exam, lastCycleSessionId: entry.id } : exam,
        ),
      };
}

/** Abaixo disso, a próxima revisão vem antes; acima de GOOD, depois. */
export const ADAPTIVE_REVIEW = { weak: 0.6, good: 0.85, sooner: 0.5, later: 1.5 } as const;

/**
 * Revisão adaptativa: uma sessão de revisão com questões ajusta a próxima
 * revisão pendente do assunto (e as seguintes, mantendo o espaçamento). Com
 * aproveitamento baixo, a próxima vem na metade do prazo; alto, em 1,5 vez.
 */
function adaptNextReviews(data: AppData, session: StudySession): AppData {
  if (session.type !== "Revisão" || !session.questions) return data;
  const accuracy = (session.correct ?? 0) / session.questions;
  const factor =
    accuracy < ADAPTIVE_REVIEW.weak ? ADAPTIVE_REVIEW.sooner : accuracy >= ADAPTIVE_REVIEW.good ? ADAPTIVE_REVIEW.later : 1;
  if (factor === 1) return data;
  const upcoming = data.reviews
    .filter((r) => r.topicId === session.topicId && !isReviewDone(r) && r.dueDate > session.date)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const first = upcoming[0];
  if (!first) return data;
  const gap = daysUntil(first.dueDate, session.date);
  const shift = Math.max(1, Math.round(gap * factor)) - gap;
  if (!shift) return data;
  const ids = new Set(upcoming.map((r) => r.id));
  return {
    ...data,
    reviews: data.reviews.map((r) =>
      ids.has(r.id)
        ? { ...r, dueDate: addDays(r.dueDate, shift), shiftedBySessionId: session.id, shiftDays: shift }
        : r,
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
      .map((review) => {
        let next = review;
        if (next.completedBySessionId === id) next = { ...next, completedBySessionId: undefined };
        if (next.shiftedBySessionId === id)
          next = {
            ...next,
            dueDate: addDays(next.dueDate, -(next.shiftDays ?? 0)),
            shiftedBySessionId: undefined,
            shiftDays: undefined,
          };
        return next;
      }),
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
