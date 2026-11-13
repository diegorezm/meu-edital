import { performanceBySubject, subjectsInOrder, today } from "@meu-edital/domain";
import { useStore } from "@global/store/useStore";
import { formatDuration, relativeDay } from "@global/utils/format";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

/** Abaixo disto, o assunto ganha o selo "reforçar". */
const WEAK = 0.6;
/** Questões mínimas para o aproveitamento contar. */
const MIN_QUESTIONS = 5;

const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);

/** Desempenho por matéria e por assunto. */
export function usePerformance() {
  const store = useStore();
  const navigate = useNavigate();
  const { data } = store;
  const examId = data.activeExamId;
  const [open, setOpen] = useState<string | null>(null);

  const subjects = useMemo(() => {
    if (!examId) return null;
    const date = today();
    const order = subjectsInOrder(data, examId);
    return performanceBySubject(data, examId).map((s) => ({
      id: s.subjectId,
      name: s.name,
      index: Math.max(0, order.findIndex((o) => o.id === s.subjectId)),
      time: formatDuration(s.minutes),
      sessions: s.sessions,
      questions: s.questions,
      accuracy: percent(s.accuracy),
      last: s.lastStudied ? relativeDay(s.lastStudied, date) : "nunca",
      topics: s.topics.map((t) => ({
        id: t.topicId,
        name: t.name,
        time: formatDuration(t.minutes),
        sessions: t.sessions,
        questions: t.questions,
        accuracy: percent(t.accuracy),
        weak: t.accuracy !== null && t.questions >= MIN_QUESTIONS && t.accuracy < WEAK,
        last: t.lastStudied ? relativeDay(t.lastStudied, date) : "nunca",
      })),
    }));
  }, [data, examId]);

  return {
    subjects,
    open,
    toggle: (id: string) => setOpen((current) => (current === id ? null : id)),
    close: () => setOpen(null),
    practice: (topicId: string) => navigate({ to: "/estudar", search: { assunto: topicId, tipo: "Questões" } }),
  };
}

export type Performance = ReturnType<typeof usePerformance>;
