import { z } from "zod";
import {
  type AppData,
  type CycleItem,
  getCycleItems,
  replaceCycle,
  subjectWeight,
  uid,
} from "@meu-edital/domain";
import { nameSchema, positiveSchema } from "./parse";

/**
 * Alterações que um agente pode propor. Elas nunca são aplicadas direto:
 * o app mostra a prévia de cada uma e só aplica após a confirmação do usuário.
 * Matérias e assuntos são referenciados pelo nome exato do contexto.
 */
export const ChangeSchema = z.discriminatedUnion("op", [
  z.strictObject({
    op: z.literal("setSubjectWeight"),
    subject: nameSchema,
    weight: positiveSchema,
    reason: z.string().max(500).optional(),
  }),
  z.strictObject({
    op: z.literal("setHoursPerWeek"),
    hours: z.number().positive().max(112),
    reason: z.string().max(500).optional(),
  }),
  z.strictObject({
    op: z.literal("setCycle"),
    blocks: z
      .array(
        z.strictObject({
          subject: nameSchema,
          minutes: z.number().int().min(10).max(240),
        }),
      )
      .min(1)
      .max(80),
    reason: z.string().max(500).optional(),
  }),
]);
export type Change = z.infer<typeof ChangeSchema>;

export type ChangePreview = { title: string; before: string; after: string; reason?: string };

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

function findSubject(data: AppData, examId: string, name: string) {
  const subject = data.subjects.find(
    (item) => item.examId === examId && sameName(item.name, name),
  );
  if (!subject)
    throw new Error(
      `Não encontramos a matéria '${name}'. Verifique a resposta antes de aplicar.`,
    );
  return subject;
}

const formatHours = (minutes: number) =>
  `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;

/** Descreve cada alteração como antes/depois. Lança erro se alguma referência não existir. */
export function previewChanges(
  data: AppData,
  examId: string,
  changes: Change[],
): ChangePreview[] {
  const exam = data.exams.find((item) => item.id === examId);
  if (!exam) throw new Error("Concurso não encontrado.");
  return changes.map((change) => {
    switch (change.op) {
      case "setSubjectWeight": {
        const subject = findSubject(data, examId, change.subject);
        return {
          title: `Peso de ${subject.name}`,
          before: String(subjectWeight(subject)),
          after: String(change.weight),
          reason: change.reason,
        };
      }
      case "setHoursPerWeek":
        return {
          title: "Meta semanal",
          before: `${exam.hoursPerWeek}h`,
          after: `${change.hours}h`,
          reason: change.reason,
        };
      case "setCycle": {
        change.blocks.forEach((block) => findSubject(data, examId, block.subject));
        const current = getCycleItems(data, examId);
        const total = change.blocks.reduce((sum, block) => sum + block.minutes, 0);
        return {
          title: "Ciclo de estudos",
          before: `${current.length} blocos · ${formatHours(current.reduce((sum, item) => sum + item.minutes, 0))}`,
          after: `${change.blocks.length} blocos · ${formatHours(total)}`,
          reason: change.reason,
        };
      }
    }
  });
}

export function applyChanges(
  data: AppData,
  examId: string,
  changes: Change[],
): AppData {
  previewChanges(data, examId, changes);
  return changes.reduce<AppData>((current, change) => {
    switch (change.op) {
      case "setSubjectWeight": {
        const subject = findSubject(current, examId, change.subject);
        return {
          ...current,
          subjects: current.subjects.map((item) =>
            item.id === subject.id
              ? {
                  ...item,
                  weight: change.weight,
                  questions: undefined,
                  pointsPerQuestion: undefined,
                }
              : item,
          ),
        };
      }
      case "setHoursPerWeek":
        return {
          ...current,
          exams: current.exams.map((item) =>
            item.id === examId ? { ...item, hoursPerWeek: change.hours } : item,
          ),
        };
      case "setCycle": {
        const items: CycleItem[] = change.blocks.map((block, order) => ({
          id: uid(),
          examId,
          subjectId: findSubject(current, examId, block.subject).id,
          minutes: block.minutes,
          order,
        }));
        return replaceCycle(current, examId, items);
      }
    }
  }, data);
}
