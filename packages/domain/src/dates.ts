/** Data local no formato AAAA-MM-DD. Nunca use `toISOString()`: ele usa UTC. */
export const toDateKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
export const fromDateKey = (date: string) => new Date(`${date}T12:00:00`);
export const today = () => toDateKey(new Date());
export const addDays = (date: string, days: number) => {
  const d = fromDateKey(date);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
};
/** Segunda-feira da semana de `date`. A semana vai de segunda a domingo. */
export const weekStartOf = (date: string) => {
  const d = fromDateKey(date);
  return addDays(date, -((d.getDay() + 6) % 7));
};
export const currentWeekStart = () => weekStartOf(today());
/** Dias de `from` até `date`. Negativo quando a data já passou. */
export const daysUntil = (date: string, from = today()) =>
  Math.round(
    (fromDateKey(date).getTime() - fromDateKey(from).getTime()) / 86_400_000,
  );
export const isDateKey = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(fromDateKey(value)) === value;
export const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
