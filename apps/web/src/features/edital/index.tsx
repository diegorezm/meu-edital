import { SyllabusView } from "./components/SyllabusView";
import { useSyllabus } from "./hooks/useSyllabus";

export function SyllabusPage() {
  return <SyllabusView syllabus={useSyllabus()} />;
}
