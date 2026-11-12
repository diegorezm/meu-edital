import { daysUntil, fromDateKey } from "@meu-edital/domain";

const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "14 jan". */
export function formatShortDate(date: string): string {
  const d = fromDateKey(date);
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/** Minutos como "12h05", "45 min" ou "3h". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** Números com separador de milhar do português: 1.240. */
export const formatNumber = (value: number) => value.toLocaleString("pt-BR");

/** "hoje", "ontem", "há 3 dias", "amanhã", "em 5 dias". */
export function relativeDay(date: string, from?: string): string {
  const diff = daysUntil(date, from);
  if (diff === 0) return "hoje";
  if (diff === -1) return "ontem";
  if (diff === 1) return "amanhã";
  return diff < 0 ? `há ${-diff} dias` : `em ${diff} dias`;
}
