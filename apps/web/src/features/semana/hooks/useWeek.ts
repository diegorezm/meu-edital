import {
  addDays,
  currentWeekStart,
  deleteSession,
  fromDateKey,
  type SessionChange,
  sessionsBetween,
  subjectsBehind,
  subjectsInOrder,
  today,
  topicPath,
  updateSession,
  weekSummary,
} from "@meu-edital/domain";
import { useStore } from "@global/store/useStore";
import { formatDuration, formatShortDate } from "@global/utils/format";
import { useMemo, useState } from "react";

const WEEKDAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Semana: estudado contra a meta salva, por dia e por matéria, e as sessões. */
export function useWeek() {
  const store = useStore();
  const { data } = store;
  const examId = data.activeExamId;
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const view = useMemo(() => {
    if (!examId) return null;
    const week = weekSummary(data, examId, weekStart);
    const behind = new Set(week.current ? [] : subjectsBehind(week).map((s) => s.subjectId));
    const order = subjectsInOrder(data, examId);
    const date = today();
    const maxDay = Math.max(week.targetMinutes / 7, ...week.days.map((d) => d.minutes), 1);
    return {
      label: `Semana de ${formatShortDate(week.weekStart)}`,
      studied: formatDuration(week.minutes),
      target: formatDuration(week.targetMinutes),
      percent: week.targetMinutes ? Math.round((100 * week.minutes) / week.targetMinutes) : 0,
      isCurrent: week.current,
      days: week.days.map((d) => ({
        date: d.date,
        minutes: d.minutes,
        height: Math.round((100 * d.minutes) / maxDay),
        today: d.date === date,
      })),
      subjects: week.subjects
        .filter((s) => s.targetMinutes > 0 || s.minutes > 0)
        .map((s) => ({
          id: s.subjectId,
          name: s.name,
          index: Math.max(0, order.findIndex((o) => o.id === s.subjectId)),
          studied: formatDuration(s.minutes),
          target: formatDuration(s.targetMinutes),
          progress: s.targetMinutes ? Math.min(1, s.minutes / s.targetMinutes) : 1,
          behind: behind.has(s.subjectId),
        })),
      sessions: sessionsBetween(data, examId, week.weekStart, week.weekEnd)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
        .map((session) => {
          const topic = data.topics.find((t) => t.id === session.topicId);
          return {
            ...session,
            weekday: WEEKDAY[fromDateKey(session.date).getDay()],
            subject: order.find((s) => s.id === session.subjectId)?.name ?? "Matéria",
            topic: topic ? topicPath(data, topic) : "Assunto",
          };
        }),
    };
  }, [data, examId, weekStart]);

  return {
    view,
    previous: () => setWeekStart((w) => addDays(w, -7)),
    next: () => setWeekStart((w) => (w < currentWeekStart() ? addDays(w, 7) : w)),
    editing: view?.sessions.find((s) => s.id === editingId) ?? null,
    edit: setEditingId,
    save: (id: string, change: SessionChange) => {
      store.update((d) => updateSession(d, id, change));
      setEditingId(null);
    },
    deleting: view?.sessions.find((s) => s.id === deletingId) ?? null,
    askDelete: setDeletingId,
    confirmDelete: () => {
      if (deletingId) store.update((d) => deleteSession(d, deletingId));
      setDeletingId(null);
    },
  };
}

export type WeekScreen = ReturnType<typeof useWeek>;
