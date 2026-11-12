import { WeekView } from "./components/WeekView";
import { useWeek } from "./hooks/useWeek";

export function WeekPage() {
  return <WeekView week={useWeek()} />;
}
