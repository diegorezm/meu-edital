import { MockExamsView } from "./components/MockExamsView";
import { useMockExams } from "./hooks/useMockExams";

export function MockExamsPage() {
  return <MockExamsView mocks={useMockExams()} />;
}
