import { isReviewDone, setReviewOffsets, subjectsInOrder, today, topicPath, XP } from "@meu-edital/domain";
import { useStore } from "@global/store/useStore";
import { relativeDay } from "@global/utils/format";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export type ReviewTab = "due" | "upcoming";

/** Revisões vencidas e próximas; "Revisar" abre o Estudar já como revisão. */
export function useReviews() {
  const store = useStore();
  const navigate = useNavigate();
  const { data } = store;
  const [tab, setTab] = useState<ReviewTab>("due");
  const [editing, setEditing] = useState(false);
  const examId = data.activeExamId;

  const lists = useMemo(() => {
    const date = today();
    const subjects = examId ? subjectsInOrder(data, examId) : [];
    const pending = data.reviews
      .filter((r) => r.examId === examId && !isReviewDone(r))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.stage - b.stage);
    // Um assunto com várias revisões pendentes aparece uma vez, pela mais antiga.
    const seen = new Set<string>();
    const rows = pending.flatMap((review) => {
      if (seen.has(review.topicId)) return [];
      seen.add(review.topicId);
      const topic = data.topics.find((t) => t.id === review.topicId);
      if (!topic) return [];
      return [
        {
          id: review.id,
          topicId: topic.id,
          topic: topicPath(data, topic),
          subject: subjects.find((s) => s.id === topic.subjectId)?.name ?? "Matéria",
          subjectIndex: Math.max(0, subjects.findIndex((s) => s.id === topic.subjectId)),
          dueDate: review.dueDate,
          when: relativeDay(review.dueDate, date),
          late: review.dueDate < date,
          onTimeToday: review.dueDate === date,
          stage: review.stage,
        },
      ];
    });
    return { due: rows.filter((r) => r.dueDate <= date), upcoming: rows.filter((r) => r.dueDate > date) };
  }, [data, examId]);

  return {
    hasExam: Boolean(examId),
    tab,
    setTab,
    rows: tab === "due" ? lists.due : lists.upcoming,
    dueCount: lists.due.length,
    upcomingCount: lists.upcoming.length,
    onTimeXp: XP.reviewOnTime,
    offsets: data.reviewOffsets,
    editing,
    setEditing,
    saveOffsets: (offsets: number[]) => {
      store.update((d) => setReviewOffsets(d, offsets));
      setEditing(false);
    },
    review: (topicId: string) => navigate({ to: "/estudar", search: { assunto: topicId, tipo: "Revisão" } }),
  };
}

export type Reviews = ReturnType<typeof useReviews>;
