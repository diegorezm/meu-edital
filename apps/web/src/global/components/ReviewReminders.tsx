import { addDays, isReviewDone, today } from "@meu-edital/domain";
import { platform } from "@platform/index";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useActiveExamId, useExamReviews } from "../store/queries";

const DAYS = 14;

/**
 * Agenda no aparelho os lembretes de revisão dos próximos dias (só no app
 * nativo; na web quem lembra é o servidor). Não desenha nada.
 */
export function ReviewReminders() {
  const examId = useActiveExamId();
  const reviews = useExamReviews(examId);
  const { data: remindersOn } = useQuery({
    queryKey: ["push", "assinatura"],
    queryFn: async () => Boolean(await platform.push.current()),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const days = useMemo(() => {
    if (!examId) return [];
    const start = today();
    const pending = reviews.filter((r) => !isReviewDone(r));
    return Array.from({ length: DAYS }, (_, i) => {
      const date = addDays(start, i);
      // Vencidas até aquele dia, contando as que já estavam atrasadas.
      return { date, count: pending.filter((r) => r.dueDate <= date).length };
    }).filter((d) => d.count > 0);
  }, [reviews, examId]);
  const key = JSON.stringify(days);

  useEffect(() => {
    if (remindersOn === undefined) return;
    void platform.reviewReminders.set(JSON.parse(key));
  }, [key, remindersOn]);

  return null;
}
