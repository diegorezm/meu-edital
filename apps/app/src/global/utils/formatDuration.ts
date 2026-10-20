/** 45 → "45min", 150 → "2h30", 120 → "2h". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest}min`;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-09-21" → "21 set". */
export function formatShortDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${day} ${months[month - 1]}`;
}

const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10-01" → "outubro 2026". */
export function formatMonth(date: string): string {
  const [year, month] = date.split("-").map(Number);
  return `${monthNames[month - 1]} ${year}`;
}
