import { AchievementsView } from "./components/AchievementsView";
import { useAchievements } from "./hooks/useAchievements";

export function AchievementsPage() {
  return <AchievementsView screen={useAchievements()} />;
}
