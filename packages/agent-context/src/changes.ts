import { z } from "zod";
import {
  addCycleItem,
  type AppData,
  type CycleItem,
  GENERAL_TOPIC,
  getCycleItems,
  nextPosition,
  replaceCycle,
  type Subject,
  subjectWeight,
  type Topic,
  uid,
} from "@meu-edital/domain";
import { nameSchema, positiveSchema } from "./parse";

const minutesSchema = z.number().int().min(10).max(240);

/**
 * Alterações que um agente pode propor. Elas nunca são aplicadas direto:
 * o app mostra a prévia de cada uma e só aplica após a confirmação do usuário.
 * Matérias e assuntos são referenciados pelo nome exato do contexto. As
 * alterações valem em ordem: um `setCycle` pode citar a matéria criada por um
 * `addSubject` anterior da mesma proposta.
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
          minutes: minutesSchema,
        }),
      )
      .min(1)
      .max(80),
    reason: z.string().max(500).optional(),
  }),
  z.strictObject({
    op: z.literal("addSubject"),
    subject: nameSchema,
    questions: z.number().int().positive().max(1000).optional(),
    pointsPerQuestion: positiveSchema.optional(),
    weight: positiveSchema.optional(),
    /** Assuntos em ordem. Sem eles a matéria ganha um assunto genérico. */
    topics: z.array(nameSchema).max(200).optional(),
    /** Minutos de um bloco novo no fim da jornada. Sem isso a matéria fica fora do ciclo. */
    cycleMinutes: minutesSchema.optional(),
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

type AddSubject = Extract<Change, { op: "addSubject" }>;

function addSubject(data: AppData, examId: string, change: AddSubject): AppData {
  const siblings = data.subjects.filter((item) => item.examId === examId);
  if (siblings.some((item) => sameName(item.name, change.subject)))
    throw new Error(`A matéria '${change.subject}' já existe neste concurso.`);
  const subject: Subject = {
    id: uid(),
    examId,
    name: change.subject,
    position: nextPosition(siblings),
    ...(change.questions
      ? { questions: change.questions, pointsPerQuestion: change.pointsPerQuestion ?? 1 }
      : change.weight
        ? { weight: change.weight }
        : {}),
  };
  const names: string[] = [];
  for (const name of change.topics ?? [])
    if (!names.some((seen) => sameName(seen, name))) names.push(name);
  const topics: Topic[] = (names.length ? names : [GENERAL_TOPIC]).map((name, position) => ({
    id: uid(),
    subjectId: subject.id,
    name,
    position,
  }));
  const next = { ...data, subjects: [...data.subjects, subject], topics: [...data.topics, ...topics] };
  return change.cycleMinutes ? addCycleItem(next, examId, subject.id, change.cycleMinutes) : next;
}

function previewOne(data: AppData, examId: string, change: Change): ChangePreview {
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
    case "setHoursPerWeek": {
      const exam = data.exams.find((item) => item.id === examId);
      return {
        title: "Meta semanal",
        before: `${exam?.hoursPerWeek ?? 0}h`,
        after: `${change.hours}h`,
        reason: change.reason,
      };
    }
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
    case "addSubject": {
      const topics = change.topics?.length ?? 0;
      const weight = change.questions
        ? `${change.questions} questões`
        : `peso ${change.weight ?? 1}`;
      return {
        title: `Nova matéria: ${change.subject}`,
        before: "não existe",
        after: [
          topics ? `${topics} assuntos` : "sem assuntos ainda",
          weight,
          change.cycleMinutes ? `entra na jornada com ${change.cycleMinutes} min` : "fora da jornada",
        ].join(" · "),
        reason: change.reason,
      };
    }
  }
}

function applyOne(data: AppData, examId: string, change: Change): AppData {
  switch (change.op) {
    case "setSubjectWeight": {
      const subject = findSubject(data, examId, change.subject);
      return {
        ...data,
        subjects: data.subjects.map((item) =>
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
        ...data,
        exams: data.exams.map((item) =>
          item.id === examId ? { ...item, hoursPerWeek: change.hours } : item,
        ),
      };
    case "setCycle": {
      const items: CycleItem[] = change.blocks.map((block, order) => ({
        id: uid(),
        examId,
        subjectId: findSubject(data, examId, block.subject).id,
        minutes: block.minutes,
        order,
      }));
      return replaceCycle(data, examId, items);
    }
    case "addSubject":
      return addSubject(data, examId, change);
  }
}

/**
 * Descreve cada alteração como antes/depois, na ordem em que seriam
 * aplicadas. Lança erro se alguma referência não existir.
 */
export function previewChanges(
  data: AppData,
  examId: string,
  changes: Change[],
): ChangePreview[] {
  if (!data.exams.some((item) => item.id === examId)) throw new Error("Concurso não encontrado.");
  const previews: ChangePreview[] = [];
  changes.reduce<AppData>((current, change) => {
    previews.push(previewOne(current, examId, change));
    return applyOne(current, examId, change);
  }, data);
  return previews;
}

export function applyChanges(
  data: AppData,
  examId: string,
  changes: Change[],
): AppData {
  if (!data.exams.some((item) => item.id === examId)) throw new Error("Concurso não encontrado.");
  return changes.reduce<AppData>((current, change) => applyOne(current, examId, change), data);
}
