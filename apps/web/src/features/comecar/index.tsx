import { OnboardingView } from "./components/OnboardingView";
import { useOnboarding } from "./hooks/useOnboarding";

export function OnboardingPage() {
  return <OnboardingView flow={useOnboarding()} />;
}
