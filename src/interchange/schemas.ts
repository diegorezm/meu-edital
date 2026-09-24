import { z } from "zod";
import {
  AppData,
  PlannedSession,
  Subject,
  Topic,
  currentWeekStart,
  uid,
} from "@/domain/types";

const name = z.string().trim().min(1, "O nome não pode ficar vazio.").max(120);
const topicSchema: z.ZodType<{ name: string; subtopics?: { name: string }[] }> =
  z.strictObject({
    name,
    subtopics: z.array(z.strictObject({ name })).optional(),
  });
export const ExamImportSchema = z.strictObject({
  exam: name,
  role: name,
  subjects: z
    .array(z.strictObject({ name, topics: z.array(topicSchema).min(1) }))
    .min(1),
});
export const WeeklyPlanImportSchema = z.strictObject({
  sessions: z
    .array(
      z.strictObject({
        day: z.enum(["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]),
        subject: name,
        topic: name,
        type: z.enum(["Teoria", "Questões", "Revisão"]),
        minutes: z.number().int().min(1).max(480),
      }),
    )
    .min(1),
});
export type ExamImport = z.infer<typeof ExamImportSchema>;
export type WeeklyPlanImport = z.infer<typeof WeeklyPlanImportSchema>;

function parseJson(text: string): unknown {
  const clean = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(
      "A resposta não é um JSON válido. Cole apenas o objeto JSON retornado pela IA.",
    );
  }
}
function parse<T>(text: string, schema: z.ZodType<T>): T {
  const result = schema.safeParse(parseJson(text));
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".") || "conteúdo";
    const reason =
      issue?.code === "invalid_type"
        ? "tipo incorreto ou campo ausente"
        : issue?.code === "unrecognized_keys"
          ? "contém campos não previstos"
          : issue?.code === "too_small"
            ? "valor vazio ou abaixo do mínimo"
            : issue?.code === "too_big"
              ? "valor acima do máximo"
              : "valor não permitido";
    throw new Error(`Formato inválido em '${field}': ${reason}.`);
  }
  return result.data;
}
export const parseExam = (text: string) => parse(text, ExamImportSchema);
export const parseWeeklyPlan = (text: string) =>
  parse(text, WeeklyPlanImportSchema);

export function importExam(
  data: AppData,
  examId: string,
  input: ExamImport,
): AppData {
  const existing = data.subjects.filter((s) => s.examId === examId);
  const subjects: Subject[] = [];
  const topics: Topic[] = [];
  for (const item of input.subjects) {
    let subject = [...existing, ...subjects].find(
      (s) => s.name.toLocaleLowerCase() === item.name.toLocaleLowerCase(),
    );
    if (!subject) {
      subject = { id: uid(), examId, name: item.name };
      subjects.push(subject);
    }
    for (const entry of item.topics) {
      const exists = [...data.topics, ...topics].find(
        (t) =>
          t.subjectId === subject.id &&
          !t.parentId &&
          t.name.toLocaleLowerCase() === entry.name.toLocaleLowerCase(),
      );
      const parent = exists || {
        id: uid(),
        subjectId: subject.id,
        name: entry.name,
        studied: false,
      };
      if (!exists) topics.push(parent);
      for (const sub of entry.subtopics || []) {
        if (
          ![...data.topics, ...topics].some(
            (t) =>
              t.parentId === parent.id &&
              t.name.toLocaleLowerCase() === sub.name.toLocaleLowerCase(),
          )
        )
          topics.push({
            id: uid(),
            subjectId: subject.id,
            parentId: parent.id,
            name: sub.name,
            studied: false,
          });
      }
    }
  }
  return {
    ...data,
    subjects: [...data.subjects, ...subjects],
    topics: [...data.topics, ...topics],
  };
}

export function resolveWeeklyPlan(
  data: AppData,
  examId: string,
  input: WeeklyPlanImport,
): PlannedSession[] {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return input.sessions.map((row, order) => {
    const subject = data.subjects.find(
      (s) =>
        s.examId === examId &&
        s.name.toLocaleLowerCase() === row.subject.toLocaleLowerCase(),
    );
    if (!subject)
      throw new Error(
        `Não encontramos a matéria '${row.subject}'. Verifique o conteúdo antes de importar.`,
      );
    const matches = data.topics.filter(
      (t) =>
        t.subjectId === subject.id &&
        t.name.toLocaleLowerCase() === row.topic.toLocaleLowerCase(),
    );
    const topic = matches[0];
    if (!topic)
      throw new Error(
        `Não encontramos o assunto '${row.topic}' em ${subject.name}.`,
      );
    if (matches.length > 1)
      throw new Error(
        `O assunto '${row.topic}' aparece mais de uma vez em ${subject.name}. Renomeie os assuntos para importar este plano.`,
      );
    return {
      id: uid(),
      examId,
      weekStart: currentWeekStart(),
      day: days.indexOf(row.day) as PlannedSession["day"],
      subjectId: subject.id,
      topicId: topic.id,
      type: row.type,
      minutes: row.minutes,
      order,
      completed: false,
    };
  });
}
