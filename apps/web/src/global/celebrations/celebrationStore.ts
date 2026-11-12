import type { Celebration, Level } from "@meu-edital/domain";
import { useSyncExternalStore } from "react";

/** O que a comemoração mostra depois de registrar estudo. */
export type CelebrationMoment = {
  xpGained: number;
  level: Level;
  events: Celebration[];
  contractsDone: string[];
};

let current: CelebrationMoment | null = null;
const listeners = new Set<() => void>();

export const celebrationStore = {
  get: () => current,
  show(moment: CelebrationMoment) {
    current = moment;
    for (const listener of listeners) listener();
  },
  dismiss() {
    current = null;
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useCelebration = () =>
  useSyncExternalStore(celebrationStore.subscribe, celebrationStore.get, () => null);
