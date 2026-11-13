import { PerformanceView } from "./components/PerformanceView";
import { usePerformance } from "./hooks/usePerformance";

export function PerformancePage() {
  return <PerformanceView perf={usePerformance()} />;
}
