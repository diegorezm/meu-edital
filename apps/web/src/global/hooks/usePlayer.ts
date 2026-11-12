import {
  daysUntil,
  dueReviews,
  examProgress,
  playerProfile,
  today,
  weeklyStreak,
  weekSummary,
} from "@meu-edital/domain";
import { useMemo } from "react";
import { useSession } from "../auth";
import { useStore } from "../store/useStore";

/**
 * Dados do jogador e do concurso ativo para o shell (viga, ficha, navegação).
 * Tudo derivado do estado local pelas funções de domínio.
 */
export function usePlayer() {
  const store = useStore();
  const session = useSession();
  const data = store.data;
  return useMemo(() => {
    const date = today();
    const exam = data.exams.find((e) => e.id === data.activeExamId) ?? null;
    const player = playerProfile(data, date);
    const week = exam ? weekSummary(data, exam.id) : null;
    return {
      name: session.data?.user.name ?? "Aventureiro",
      player,
      exam,
      exams: data.exams,
      examCoverage: exam ? examProgress(data, exam.id) : 0,
      daysToExam: exam?.examDate ? daysUntil(exam.examDate, date) : null,
      streak: exam ? weeklyStreak(data, exam.id, date).weeks : 0,
      week,
      questions: data.sessions.reduce((sum, s) => sum + (s.questions ?? 0), 0),
      dueReviews: exam ? dueReviews(data, exam.id, date).length : 0,
      today: date,
      selectExam: (examId: string) =>
        store.update((current) => (current.activeExamId === examId ? current : { ...current, activeExamId: examId })),
    };
  }, [data, session.data?.user.name, store]);
}

export type PlayerView = ReturnType<typeof usePlayer>;
