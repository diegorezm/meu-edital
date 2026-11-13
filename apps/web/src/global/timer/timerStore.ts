import { elapsedMs, type TimerState } from "@meu-edital/domain";
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
/**
 * Com a aba fechada, quem avisa o fim do bloco é o servidor (Web Push). Se o
 * estudante não ligou os avisos, o pedido é ignorado sem erro.
 */
function syncBlockEndPush(prev: TimerState | null, next: TimerState | null) {
  const runningPlan = (t: TimerState | null) =>
    t?.runningSince && t.plannedMinutes && !t.notified ? t : null;
  const was = runningPlan(prev);
  const now = runningPlan(next);
  if (now && (!was || was.runningSince !== now.runningSince)) {
    const endsAt = Date.now() + now.plannedMinutes! * 60_000 - elapsedMs(now, Date.now());
    if (endsAt > Date.now())
      void fetch("/api/push/fim-de-bloco", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endsAt: Math.round(endsAt), subject: now.subjectName ?? "o bloco" }),
      }).catch(() => undefined);
  } else if (was && !now) {
    void fetch("/api/push/fim-de-bloco", { method: "DELETE" }).catch(() => undefined);
  }
}

export const timerStore = {
  get: () => current,
  set(next: TimerState | null) {
    syncBlockEndPush(current, next);
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
