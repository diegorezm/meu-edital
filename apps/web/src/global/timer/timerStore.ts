import { type TimerState } from "@meu-edital/domain";
import { platform } from "@platform/index";
import { useSyncExternalStore } from "react";

const KEY = "cronometro";

let current: TimerState | null = read();
const listeners = new Set<() => void>();

function read(): TimerState | null {
  try {
    const raw = platform.preferences.get(KEY);
    return raw ? (JSON.parse(raw) as TimerState) : null;
  } catch {
    return null;
  }
}

/**
 * Estado do cronômetro, guardado no aparelho. Sobrevive a recarregar e
 * fechar a aba porque guarda instantes, não um contador.
 */
export const timerStore = {
  get: () => current,
  set(next: TimerState | null) {
    current = next;
    if (next) platform.preferences.set(KEY, JSON.stringify(next));
    else platform.preferences.remove(KEY);
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useTimerState(): TimerState | null {
  return useSyncExternalStore(timerStore.subscribe, timerStore.get, () => null);
}

/** Relógio que bate a cada segundo enquanto `active`. */
export function useNow(active: boolean): number {
  return useSyncExternalStore(
    (notify) => {
      if (!active) return () => undefined;
      const id = setInterval(notify, 1000);
      return () => clearInterval(id);
    },
    () => (active ? Math.floor(Date.now() / 1000) * 1000 : 0),
    () => 0,
  );
}
