import { elapsedMs, pauseTimer, type TimerState } from "@meu-edital/domain";
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
 * Mantém os avisos do cronômetro em dia com o estado: o aviso de fim de bloco
 * com o app fechado e, no app nativo, a notificação com o tempo correndo.
 */
function syncTimerSideEffects(prev: TimerState | null, next: TimerState | null) {
  const runningPlan = (t: TimerState | null) =>
    t?.runningSince && t.plannedMinutes && !t.notified ? t : null;
  const was = runningPlan(prev);
  const now = runningPlan(next);
  if (now && (!was || was.runningSince !== now.runningSince)) {
    const endsAt = Date.now() + now.plannedMinutes! * 60_000 - elapsedMs(now, Date.now());
    if (endsAt > Date.now()) void platform.blockEnd.schedule(Math.round(endsAt), now.subjectName ?? "o bloco");
  } else if (was && !now) {
    void platform.blockEnd.cancel();
  }

  const subject = next?.subjectName ?? "Estudo";
  if (!next) void platform.studyTimer.clear();
  else if (next.runningSince) void platform.studyTimer.showRunning(next.runningSince, next.accumulatedMs, subject);
  else void platform.studyTimer.showPaused(next.accumulatedMs, subject);
}

export const timerStore = {
  get: () => current,
  set(next: TimerState | null) {
    syncTimerSideEffects(current, next);
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

// Tocar em "Pausar" na notificação do Android pausa o cronômetro do app.
platform.studyTimer.onPause(() => {
  const timer = timerStore.get();
  if (timer?.runningSince) timerStore.set(pauseTimer(timer, Date.now()));
});

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
