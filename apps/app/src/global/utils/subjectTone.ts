import type { AppData } from "@meu-edital/domain";
import { subjectTones } from "@meu-edital/brand";

/** Cor fixa da matéria, pela posição dela no edital: a mesma em todas as telas. */
export function subjectTone(data: AppData, subjectId: string) {
  const subject = data.subjects.find((item) => item.id === subjectId);
  const index = data.subjects
    .filter((item) => item.examId === subject?.examId)
    .findIndex((item) => item.id === subjectId);
  return subjectTones[Math.max(0, index) % subjectTones.length];
}
