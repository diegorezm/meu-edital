import {
  bossDefeated,
  celebrationsBetween,
  deleteMockExam,
  levelInfo,
  markCelebrationsSeen,
  mockExamHistory,
  playerXp,
  recordMockExam,
  subjectsInOrder,
  today,
} from "@meu-edital/domain";
import { celebrationStore } from "@global/celebrations/celebrationStore";
import { useStore } from "@global/store/useStore";
import { formatShortDate } from "@global/utils/format";
import { useMemo, useState } from "react";

type Row = { questions: string; correct: string };

/** Simulados: o chefe da volta, a evolução e o registro de uma prova. */
export function useMockExams() {
  const store = useStore();
  const { data } = store;
  const exam = data.exams.find((e) => e.id === data.activeExamId);
  const [registering, setRegistering] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [rowsExamId, setRowsExamId] = useState<string | null>(exam?.id ?? null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const activeRows = rowsExamId === (exam?.id ?? null) ? rows : {};

  const view = useMemo(() => {
    if (!exam) return null;
    const history = mockExamHistory(data, exam.id);
    const laps = exam.cycleLaps;
    const boss: "waiting" | "threat" | "defeated" =
      laps === 0 ? "waiting" : bossDefeated(data, exam.id, laps) ? "defeated" : "threat";
    return {
      laps,
      boss,
      subjects: subjectsInOrder(data, exam.id).map((s) => ({ id: s.id, name: s.name })),
      mocks: [...history.mocks].reverse().map((m) => ({
        id: m.id,
        title: m.title,
        date: formatShortDate(m.date),
        score: Math.round(m.score * 100),
      })),
      chart: history.mocks.map((m) => ({ label: formatShortDate(m.date), score: m.score })),
      bySubject: history.bySubject
        .filter((s) => s.points.length)
        .map((s) => ({
          id: s.subjectId,
          name: s.name,
          last: Math.round(s.points[s.points.length - 1].score * 100),
          before: s.points.length > 1 ? Math.round(s.points[s.points.length - 2].score * 100) : null,
        })),
    };
  }, [data, exam]);

  const register = () => {
    if (submitting || !exam) return;
    const subjects = Object.entries(activeRows)
      .map(([subjectId, r]) => ({ subjectId, questions: Number(r.questions) || 0, correct: Number(r.correct) || 0 }))
      .filter((r) => r.questions > 0);
    if (!subjects.length) return setError("Preencha as questões de pelo menos uma matéria.");
    if (subjects.some((r) => r.correct < 0 || r.correct > r.questions))
      return setError("Acertos devem ficar entre 0 e o número de questões.");
    if (!date || date > today()) return setError("A data não pode estar no futuro.");
    setSubmitting(true);
    try {
      let payload: Parameters<typeof celebrationStore.show>[0] | null = null;
      store.update((before) => {
        const after = recordMockExam(before, { examId: exam.id, date, title, lap: exam.cycleLaps, subjects });
        const events = celebrationsBetween(before, after);
        const xp = playerXp(after).total;
        payload = {
          xpGained: Math.max(0, xp - playerXp(before).total),
          level: levelInfo(xp),
          events,
          contractsDone: [],
        };
        return markCelebrationsSeen(after, events.map((e) => e.id));
      });
      if (payload) celebrationStore.show(payload);
      setRegistering(false);
      setRows({});
      setTitle("");
      setError("");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    view,
    registering,
    setRegistering: (open: boolean) => {
      if (open) setDate(today());
      setRegistering(open);
    },
    title,
    setTitle,
    date,
    setDate,
    rows: activeRows,
    setRow: (subjectId: string, field: keyof Row, value: string) => {
      const currentExamId = exam?.id ?? null;
      const base = rowsExamId === currentExamId ? rows : {};
      setRowsExamId(currentExamId);
      setRows({ ...base, [subjectId]: { ...(base[subjectId] ?? { questions: "", correct: "" }), [field]: value } });
    },
    error,
    submitting,
    register,
    deleting: view?.mocks.find((m) => m.id === deletingId) ?? null,
    askDelete: setDeletingId,
    confirmDelete: () => {
      if (deletingId) store.update((d) => deleteMockExam(d, deletingId));
      setDeletingId(null);
    },
  };
}

export type MockExams = ReturnType<typeof useMockExams>;
