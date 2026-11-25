import {
  type AppData,
  celebrationsBetween,
  cycleState,
  dailyContracts,
  elapsedMinutes,
  elapsedMs,
  formatClock,
  getCycleItems,
  levelInfo,
  markCelebrationsSeen,
  pauseTimer,
  playerXp,
  recordSession,
  resumeTimer,
  sessionXp,
  startTimer,
  type StudyType,
  subjectsInOrder,
  suggestNextTopic,
  today,
  topicPath,
  topicsInOrder,
  validateSession,
} from "@meu-edital/domain";
import { celebrationStore } from "@global/celebrations/celebrationStore";
import { useStore } from "@global/store/useStore";
import { timerStore, useNow, useTimerState } from "@global/timer/timerStore";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export type StudySearch = { bloco?: string; assunto?: string; tipo?: string };

const TYPES: StudyType[] = ["Teoria", "Questões", "Revisão"];
const asType = (value?: string): StudyType | undefined =>
  TYPES.find((t) => t.toLowerCase() === value?.toLowerCase());

type Choice = {
  subjectId: string;
  topicId: string;
  type: StudyType;
  cycleItemId?: string;
  plannedMinutes?: number;
};

/** Ponto de partida pedido pela URL: um bloco, um assunto (revisão) ou estudo livre. */
function initialChoice(data: AppData, examId: string, search: StudySearch): Choice {
  // Sem nada na URL, o padrão é o próximo bloco da jornada.
  const blockId = search.bloco ?? (search.assunto ? undefined : cycleState(data, examId).next?.id);
  const block = blockId ? getCycleItems(data, examId).find((i) => i.id === blockId) : undefined;
  if (block)
    return {
      subjectId: block.subjectId,
      topicId: suggestNextTopic(data, block.subjectId)?.id ?? "",
      type: "Teoria" as StudyType,
      cycleItemId: block.id,
      plannedMinutes: block.minutes,
    };
  const topic = search.assunto ? data.topics.find((t) => t.id === search.assunto) : undefined;
  if (topic)
    return { subjectId: topic.subjectId, topicId: topic.id, type: asType(search.tipo) ?? "Revisão" };
  const subject = subjectsInOrder(data, examId)[0];
  return {
    subjectId: subject?.id ?? "",
    topicId: subject ? (suggestNextTopic(data, subject.id)?.id ?? "") : "",
    type: "Teoria" as StudyType,
  };
}

/** Estado e ações da tela Estudar: cronômetro, escolha do assunto e registro. */
export function useStudy(search: StudySearch) {
  const store = useStore();
  const navigate = useNavigate();
  const { data } = store;
  const exam = data.exams.find((e) => e.id === data.activeExamId);
  const timer = useTimerState();
  // Pausado, o tempo não depende do relógio; correndo, `now` bate a cada segundo.
  const now = useNow(Boolean(timer?.runningSince));
  const [choice, setChoice] = useState<Choice | null>(() =>
    exam ? initialChoice(data, exam.id, search) : null,
  );

  // Com cronômetro ativo, ele manda no concurso/matéria/assunto em estudo.
  const active = timer ?? (choice && exam ? { ...choice, examId: exam.id } : null);
  const activeExamId = active?.examId ?? exam?.id ?? "";

  const [form, setForm] = useState({ minutes: "", date: today(), questions: "", correct: "", note: "" });
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const subjects = activeExamId ? subjectsInOrder(data, activeExamId) : [];
  const topics = active?.subjectId ? topicsInOrder(data, active.subjectId) : [];
  const subject = subjects.find((s) => s.id === active?.subjectId);
  const subjectIndex = subjects.findIndex((s) => s.id === active?.subjectId);
  const topic = data.topics.find((t) => t.id === active?.topicId);
  const blockNumeral = active?.cycleItemId
    ? getCycleItems(data, activeExamId).findIndex((i) => i.id === active.cycleItemId) + 1
    : 0;

  const change = (patch: Partial<Choice & { subjectName?: string }>) => {
    if (timer) timerStore.set({ ...timer, ...patch });
    else setChoice((c) => (c ? { ...c, ...patch } : c));
  };

  const minutesValue = Number(form.minutes) || (timer ? elapsedMinutes(timer, now) : (active?.plannedMinutes ?? 0));
  const preview = useMemo(
    () => sessionXp({ minutes: minutesValue, correct: Number(form.correct) || 0 }),
    [minutesValue, form.correct],
  );

  const openRegister = () => {
    setError("");
    setForm((f) => ({
      ...f,
      date: today(),
      minutes: String(timer ? elapsedMinutes(timer, Date.now()) : minutesValue || 30),
    }));
    if (timer?.runningSince) timerStore.set(pauseTimer(timer, Date.now()));
    setRegistering(true);
  };

  const register = async () => {
    if (submitting || !active || !activeExamId) return;
    const input = {
      examId: activeExamId,
      subjectId: active.subjectId,
      topicId: active.topicId,
      type: active.type,
      minutes: Number(form.minutes),
      ...(active.cycleItemId ? { cycleItemId: active.cycleItemId } : {}),
      ...(form.questions !== "" ? { questions: Number(form.questions) } : {}),
      ...(form.correct !== "" ? { correct: Number(form.correct) } : {}),
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    };
    const problem = validateSession(input);
    if (problem) return setError(problem);
    if (!form.date || form.date > today()) return setError("A data não pode estar no futuro.");

    setSubmitting(true);
    try {
      const date = today();
      let payload: Parameters<typeof celebrationStore.show>[0] | null = null;
      store.update((before) => {
        const after = recordSession(before, input, form.date);
        const events = celebrationsBetween(before, after, date);
        const contractsBefore = new Set(
          dailyContracts(before, activeExamId, date).filter((c) => c.done).map((c) => c.id),
        );
        const contractsDone = dailyContracts(after, activeExamId, date)
          .filter((c) => c.done && !contractsBefore.has(c.id))
          .map((c) => c.title);
        const xp = playerXp(after, date).total;
        payload = {
          xpGained: Math.max(0, xp - playerXp(before, date).total),
          level: levelInfo(xp),
          events,
          contractsDone,
        };
        return markCelebrationsSeen(after, events.map((e) => e.id));
      });
      timerStore.set(null);
      setRegistering(false);
      if (payload) celebrationStore.show(payload);
      await navigate({ to: "/" });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    exam,
    hasSubjects: subjects.length > 0,
    subjects,
    topics: topics.map((t) => ({ id: t.id, label: topicPath(data, t) })),
    subject,
    subjectIndex: Math.max(0, subjectIndex),
    topic: topic ? topicPath(data, topic) : undefined,
    active,
    blockNumeral,
    clock: timer ? formatClock(elapsedMs(timer, now)) : "00:00",
    running: Boolean(timer?.runningSince),
    started: Boolean(timer),
    plannedMinutes: active?.plannedMinutes,
    types: TYPES,
    changeType: (type: StudyType) => change({ type }),
    changeTopic: (topicId: string) => change({ topicId }),
    changeSubject: (subjectId: string) =>
      change({
        subjectId,
        subjectName: subjects.find((s) => s.id === subjectId)?.name,
        topicId: suggestNextTopic(data, subjectId)?.id ?? "",
        cycleItemId: undefined,
        plannedMinutes: undefined,
      }),
    goFree: () =>
      change({ cycleItemId: undefined, plannedMinutes: undefined }),
    start: () =>
      active &&
      activeExamId &&
      timerStore.set(startTimer({ ...active, examId: activeExamId, subjectName: subject?.name }, Date.now())),
    pause: () => timer && timerStore.set(pauseTimer(timer, Date.now())),
    resume: () => timer && timerStore.set(resumeTimer(timer, Date.now())),
    confirmingDiscard,
    setConfirmingDiscard,
    discard: () => {
      setConfirmingDiscard(false);
      timerStore.set(null);
    },
    form,
    setField: (field: keyof typeof form, value: string) => setForm((f) => ({ ...f, [field]: value })),
    preview,
    error,
    submitting,
    registering,
    setRegistering,
    openRegister,
    register,
  };
}

export type Study = ReturnType<typeof useStudy>;
