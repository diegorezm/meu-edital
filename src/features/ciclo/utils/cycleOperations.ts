import type { AppData } from "@domain/types";

export function getCycleItems(data: AppData, examId: string) {
  return data.cycle
    .filter((item) => item.examId === examId)
    .sort((a, b) => a.order - b.order);
}

export function getNextCycleItem<T>(items: T[], position: number) {
  return items.length ? items[position % items.length] : undefined;
}

export function reorderCycle(
  data: AppData,
  selectedId: string,
  neighborId: string,
): AppData {
  const selected = data.cycle.find((item) => item.id === selectedId);
  const neighbor = data.cycle.find((item) => item.id === neighborId);
  if (!selected || !neighbor) return data;
  return {
    ...data,
    cycle: data.cycle.map((item) =>
      item.id === selectedId
        ? { ...item, order: neighbor.order }
        : item.id === neighborId
          ? { ...item, order: selected.order }
          : item,
    ),
  };
}

export function removeCycleItem(
  data: AppData,
  id: string,
  examId: string,
): AppData {
  return {
    ...data,
    cycle: data.cycle.filter((item) => item.id !== id),
    cyclePosition: { ...data.cyclePosition, [examId]: 0 },
  };
}
