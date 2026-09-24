import { z } from "zod";

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
