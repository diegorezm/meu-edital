import { weeklyAllocation } from "./allocation";
import type { AppData, CycleItem, Exam } from "./types";
import { uid } from "./types";

export function getCycleItems(data: AppData, examId: string) {
  return data.cycle
    .filter((item) => item.examId === examId)
    .sort((a, b) => a.order - b.order);
}

export function cycleState(data: AppData, examId: string) {
  const items = getCycleItems(data, examId);
  const exam = data.exams.find((item) => item.id === examId);
  const position = items.length
    ? (exam?.cyclePosition || 0) % items.length
    : 0;
  return {
    items,
    position,
    laps: exam?.cycleLaps || 0,
    next: items[position] as CycleItem | undefined,
    lapMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
  };
}

/**
 * Monta um ciclo cuja volta completa equivale à meta semanal. Cada matéria
 * recebe blocos proporcionais ao tempo sugerido em `weeklyAllocation`, e os
 * blocos são intercalados para que a mesma matéria não se repita em sequência.
 */
export function buildCycle(
  data: AppData,
  examId: string,
  { blockMinutes = 60 }: { blockMinutes?: number } = {},
): CycleItem[] {
  const allocation = weeklyAllocation(data, examId).filter(
    (item) => item.minutes > 0,
  );
  const plans = allocation.map((item) => {
    const blocks = Math.max(1, Math.round(item.minutes / blockMinutes));
    const minutes = Math.max(
      15,
      Math.round(item.minutes / blocks / 5) * 5,
    );
    return { subjectId: item.subjectId, blocks, minutes };
  });
  const total = plans.reduce((sum, plan) => sum + plan.blocks, 0);
  const remaining = plans.map((plan) => plan.blocks);
  const current = plans.map(() => 0);
  const order: number[] = [];
  for (let step = 0; step < total; step += 1) {
    const candidates = plans
      .map((plan, index) => index)
      .filter((index) => remaining[index] > 0);
    for (const index of candidates) current[index] += plans[index].blocks;
    candidates.sort((a, b) => current[b] - current[a]);
    const best =
      candidates[0] === order.at(-1) && candidates.length > 1
        ? candidates[1]
        : candidates[0];
    current[best] -= total;
    remaining[best] -= 1;
    order.push(best);
  }
  return order.map((index, position) => ({
    id: uid(),
    examId,
    subjectId: plans[index].subjectId,
    minutes: plans[index].minutes,
    order: position,
  }));
}

function updateExam(
  data: AppData,
  examId: string,
  change: (exam: Exam) => Exam,
): AppData {
  return {
    ...data,
    exams: data.exams.map((exam) => (exam.id === examId ? change(exam) : exam)),
  };
}

/** Substitui o ciclo do concurso e recomeça a volta atual. */
export function replaceCycle(
  data: AppData,
  examId: string,
  items: CycleItem[],
): AppData {
  return updateExam(
    {
      ...data,
      cycle: [
        ...data.cycle.filter((item) => item.examId !== examId),
        ...items.map((item, order) => ({ ...item, examId, order })),
      ],
    },
    examId,
    (exam) => ({ ...exam, cyclePosition: 0 }),
  );
}

/** Avança para o bloco seguinte ao informado, contando a volta quando o ciclo termina. */
export function advanceCycle(
  data: AppData,
  examId: string,
  cycleItemId: string,
): AppData {
  const items = getCycleItems(data, examId);
  const index = items.findIndex((item) => item.id === cycleItemId);
  if (index < 0) return data;
  const completesLap = index === items.length - 1;
  return updateExam(data, examId, (exam) => ({
    ...exam,
    cyclePosition: completesLap ? 0 : index + 1,
    cycleLaps: (exam.cycleLaps || 0) + (completesLap ? 1 : 0),
  }));
}

export function addCycleItem(
  data: AppData,
  examId: string,
  subjectId: string,
  minutes: number,
): AppData {
  const items = getCycleItems(data, examId);
  return {
    ...data,
    cycle: [
      ...data.cycle,
      {
        id: uid(),
        examId,
        subjectId,
        minutes,
        order: (items.at(-1)?.order ?? -1) + 1,
      },
    ],
  };
}

export function updateCycleItem(
  data: AppData,
  id: string,
  change: Partial<Pick<CycleItem, "minutes" | "subjectId">>,
): AppData {
  return {
    ...data,
    cycle: data.cycle.map((item) =>
      item.id === id ? { ...item, ...change } : item,
    ),
  };
}

export function moveCycleItem(
  data: AppData,
  examId: string,
  id: string,
  direction: -1 | 1,
): AppData {
  const items = getCycleItems(data, examId);
  const index = items.findIndex((item) => item.id === id);
  const neighbor = items[index + direction];
  if (index < 0 || !neighbor) return data;
  const selected = items[index];
  return {
    ...data,
    cycle: data.cycle.map((item) =>
      item.id === selected.id
        ? { ...item, order: neighbor.order }
        : item.id === neighbor.id
          ? { ...item, order: selected.order }
          : item,
    ),
  };
}

export function removeCycleItem(
  data: AppData,
  examId: string,
  id: string,
): AppData {
  const items = getCycleItems(data, examId);
  const index = items.findIndex((item) => item.id === id);
  const { position } = cycleState(data, examId);
  return updateExam(
    { ...data, cycle: data.cycle.filter((item) => item.id !== id) },
    examId,
    (exam) => ({
      ...exam,
      cyclePosition:
        index >= 0 && index < position ? position - 1 : position,
    }),
  );
}
