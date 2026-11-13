import { z } from "zod";
import { type AppData, isDateKey, startExam } from "@meu-edital/domain";
import type { ChangePreview } from "./changes";
import { nameSchema, positiveSchema } from "./parse";

/**
 * Um concurso novo (edital) inteiro: matérias, assuntos e meta semanal. Ao
 * aplicar, vira o concurso ativo e ganha uma jornada montada pelos pesos.
 */
export const NewExamSchema = z.strictObject({
  name: nameSchema,
  role: nameSchema.optional(),
  board: nameSchema.optional(),
  examDate: z.string().refine(isDateKey, "Use a data no formato AAAA-MM-DD.").optional(),
  hoursPerWeek: z.number().positive().max(112),
  subjects: z
    .array(
      z.strictObject({
        name: nameSchema,
        questions: z.number().int().positive().max(1000).optional(),
        pointsPerQuestion: positiveSchema.optional(),
        weight: positiveSchema.optional(),
        topics: z.array(nameSchema).max(200).optional(),
      }),
    )
    .min(1)
    .max(60),
});
export type NewExam = z.infer<typeof NewExamSchema>;

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");

/** Prévia do concurso novo. Lança erro se já existe um concurso com o mesmo nome. */
export function previewNewExam(data: AppData, exam: NewExam): ChangePreview[] {
  if (data.exams.some((item) => sameName(item.name, exam.name)))
    throw new Error(`Já existe um concurso chamado '${exam.name}'.`);
  const details = [exam.role, exam.board, exam.examDate].filter(Boolean).join(" · ");
  return [
    {
      title: `Novo concurso: ${exam.name}`,
      before: "não existe",
      after: `${exam.subjects.length} matérias · ${exam.hoursPerWeek}h por semana${details ? ` · ${details}` : ""} · vira o concurso ativo`,
    },
    ...exam.subjects.map((subject) => ({
      title: `Nova matéria: ${subject.name}`,
      before: "não existe",
      after: `${subject.topics?.length ?? 0} assuntos${subject.questions ? ` · ${subject.questions} questões` : subject.weight ? ` · peso ${subject.weight}` : ""}`,
    })),
  ];
}

export function applyNewExam(data: AppData, exam: NewExam): AppData {
  previewNewExam(data, exam);
  return startExam(data, exam);
}
