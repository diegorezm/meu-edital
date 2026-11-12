import { StudyView } from "./components/StudyView";
import { type StudySearch, useStudy } from "./hooks/useStudy";

export function StudyPage({ search }: { search: StudySearch }) {
  return <StudyView study={useStudy(search)} />;
}
