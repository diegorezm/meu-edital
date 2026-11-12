import { HomeView } from "./components/HomeView";
import { useHome } from "./hooks/useHome";

export function HomePage() {
  return <HomeView home={useHome()} />;
}
