import type { Review } from "@meu-edital/domain";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "./useStore";

/**
 * Leituras granulares com o TanStack DB: o componente só renderiza quando as
 * linhas que ele lê mudam, em vez de a cada alteração em qualquer tabela.
 */

/** Concurso ativo. */
export function useActiveExamId(): string | null {
  const { userSettings } = useCollections();
  const { data } = useLiveQuery((q) => q.from({ s: userSettings }));
  return data?.[0]?.activeExamId ?? null;
}

/** Revisões de um concurso. */
export function useExamReviews(examId: string | null): Review[] {
  const { reviews } = useCollections();
  const { data } = useLiveQuery((q) =>
    examId ? q.from({ r: reviews }).where(({ r }) => eq(r.examId, examId)) : null,
  );
  return (data ?? []) as Review[];
}
