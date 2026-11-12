import {
  addCycleItem,
  buildCycle,
  cycleState,
  moveCycleItem,
  removeCycleItem,
  replaceCycle,
  skipToCycleItem,
  subjectsInOrder,
  updateCycleItem,
} from "@meu-edital/domain";
import { useStore } from "@global/store/useStore";
import { formatDuration } from "@global/utils/format";
import type { BlockState } from "@meu-edital/ui";
import { toRoman } from "@meu-edital/ui";
import { useMemo, useState } from "react";

/** Estado e ações da Jornada: todas as cartas da volta e a edição de cada uma. */
export function useJourney() {
  const store = useStore();
  const { data } = store;
  const exam = data.exams.find((e) => e.id === data.activeExamId);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const view = useMemo(() => {
    if (!exam) return null;
    const cycle = cycleState(data, exam.id);
    const subjects = subjectsInOrder(data, exam.id);
    const indexOf = (id: string) => Math.max(0, subjects.findIndex((s) => s.id === id));
    return {
      lap: cycle.laps + 1,
      position: cycle.position,
      lapTime: formatDuration(cycle.lapMinutes),
      target: formatDuration(exam.hoursPerWeek * 60),
      subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
      cards: cycle.items.map((item, i) => ({
        id: item.id,
        numeral: toRoman(i + 1),
        index: i,
        state: (i < cycle.position ? "done" : i === cycle.position ? "now" : "next") as BlockState,
        subject: subjects.find((s) => s.id === item.subjectId)?.name ?? "Matéria",
        subjectIndex: indexOf(item.subjectId),
        subjectId: item.subjectId,
        minutes: item.minutes,
      })),
    };
  }, [data, exam]);

  const examId = exam?.id ?? "";
  const card = view?.cards.find((c) => c.id === selected) ?? null;

  return {
    view,
    card,
    select: setSelected,
    adding,
    setAdding,
    regenerating,
    setRegenerating,
    setMinutes: (id: string, minutes: number) =>
      minutes >= 5 && minutes <= 600 && store.update((d) => updateCycleItem(d, id, { minutes })),
    move: (id: string, direction: -1 | 1) => store.update((d) => moveCycleItem(d, examId, id, direction)),
    skipTo: (id: string) => store.update((d) => skipToCycleItem(d, examId, id)),
    remove: (id: string) => {
      store.update((d) => removeCycleItem(d, examId, id));
      setSelected(null);
    },
    add: (subjectId: string, minutes: number) => {
      if (!subjectId || !(minutes >= 5)) return;
      store.update((d) => addCycleItem(d, examId, subjectId, minutes));
      setAdding(false);
    },
    regenerate: () => {
      store.update((d) => replaceCycle(d, examId, buildCycle(d, examId)));
      setRegenerating(false);
    },
  };
}

export type Journey = ReturnType<typeof useJourney>;
