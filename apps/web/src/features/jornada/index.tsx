import { JourneyView } from "./components/JourneyView";
import { useJourney } from "./hooks/useJourney";

export function JourneyPage() {
  return <JourneyView journey={useJourney()} />;
}
