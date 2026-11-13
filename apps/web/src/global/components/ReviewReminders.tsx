import { addDays, isReviewDone, today } from "@meu-edital/domain";
import { platform } from "@platform/index";
import { useEffect, useMemo } from "react";
import { useStore } from "../store/useStore";

const DAYS = 14;

/**
 * Agenda no aparelho os lembretes de revisão dos próximos dias (só no app
 * nativo; na web quem lembra é o servidor). Não desenha nada.
 */
export function ReviewReminders() {
  const { data } = useStore();
  const examId = data.activeExamId;
  const days = useMemo(() => {
    if (!examId) return [];
    const start = today();
    const pending = data.reviews.filter((r) => r.examId === examId && !isReviewDone(r));
    return Array.from({ length: DAYS }, (_, i) => {
      const date = addDays(start, i);
      // Vencidas até aquele dia, contando as que já estavam atrasadas.
      return { date, count: pending.filter((r) => r.dueDate <= date).length };
    }).filter((d) => d.count > 0);
  }, [data.reviews, examId]);
  const key = JSON.stringify(days);

  useEffect(() => {
    if (!platform.native) return;
    void platform.reviewReminders.set(JSON.parse(key));
  }, [key]);

  return null;
}
