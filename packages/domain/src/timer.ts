import type { StudyType } from "./types";

/**
 * Cronômetro de estudo. Guarda o instante de início e o tempo acumulado,
 * nunca um contador, para sobreviver a recarregar ou fechar o app.
 */
export type TimerState = {
  examId: string;
  subjectId: string;
  topicId: string;
  type: StudyType;
  cycleItemId?: string;
  /** Nome da matéria, para os avisos. */
  subjectName?: string;
  /** Minutos planejados (do bloco), para o aviso de fim. */
  plannedMinutes?: number;
  /** Instante (ms) em que voltou a correr; null quando pausado. */
  runningSince: number | null;
  /** Tempo acumulado nas corridas anteriores (ms). */
  accumulatedMs: number;
  /** Já avisou que o tempo planejado acabou. */
  notified?: boolean;
};

export function startTimer(
  setup: Omit<TimerState, "runningSince" | "accumulatedMs" | "notified">,
  now: number,
): TimerState {
  return { ...setup, runningSince: now, accumulatedMs: 0 };
}

export function pauseTimer(timer: TimerState, now: number): TimerState {
  if (timer.runningSince === null) return timer;
  return {
    ...timer,
    runningSince: null,
    accumulatedMs: timer.accumulatedMs + Math.max(0, now - timer.runningSince),
  };
}

export function resumeTimer(timer: TimerState, now: number): TimerState {
  return timer.runningSince === null ? { ...timer, runningSince: now } : timer;
}

export function elapsedMs(timer: TimerState, now: number): number {
  return timer.accumulatedMs + (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince));
}

/** Minutos para registrar: arredonda para o minuto mais próximo, no mínimo 1. */
export function elapsedMinutes(timer: TimerState, now: number): number {
  return Math.max(1, Math.round(elapsedMs(timer, now) / 60_000));
}

/** "38:12" ou "1:05:09". */
export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** O tempo planejado acabou e ainda não houve aviso. */
export function shouldNotifyEnd(timer: TimerState, now: number): boolean {
  return Boolean(
    timer.plannedMinutes && !timer.notified && elapsedMs(timer, now) >= timer.plannedMinutes * 60_000,
  );
}
