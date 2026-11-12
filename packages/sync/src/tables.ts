import { z } from "zod";
import { type AppData, SKINS } from "@meu-edital/domain";

/**
 * Tabelas sincronizadas, na ordem pais antes dos filhos. Inserções seguem
 * esta ordem; exclusões seguem a ordem inversa.
 */
export const TABLES = [
  "userSettings",
  "exams",
  "subjects",
  "topics",
  "cycleItems",
  "studySessions",
  "reviews",
  "weekTargets",
] as const;
export type TableName = (typeof TABLES)[number];

/** Id fixo da linha de preferências no protocolo; o servidor usa o id do usuário. */
export const SETTINGS_ID = "me";

const id = z.string().min(1).max(64);
const text = (max = 1024) => z.string().max(max);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data no formato AAAA-MM-DD");
const count = z.number().int().min(0).max(100_000);
const optional = <T extends z.ZodType>(schema: T) => schema.optional();

/** Formato de cada linha no protocolo: o mesmo do domínio, validado. */
export const rowSchemas = {
  userSettings: z.strictObject({
    id: z.literal(SETTINGS_ID),
    activeExamId: id.nullable(),
    reviewOffsets: z.array(z.number().int().min(1).max(365)).max(10),
    skin: z.enum(SKINS.map((s) => s.id) as [string, ...string[]]),
    seenCelebrations: z.array(z.string().max(200)).max(200),
  }),
  exams: z.strictObject({
    id,
    name: text(),
    role: text(),
    board: optional(text()),
    examDate: optional(date),
    hoursPerWeek: z.number().min(0).max(112),
    createdAt: date,
    cyclePosition: count,
    cycleLaps: count,
    lastCycleSessionId: optional(id),
  }),
  subjects: z.strictObject({
    id,
    examId: id,
    name: text(),
    position: z.number().int(),
    weight: optional(z.number().positive().max(100_000)),
    questions: optional(z.number().int().positive().max(100_000)),
    pointsPerQuestion: optional(z.number().positive().max(100_000)),
  }),
  topics: z.strictObject({
    id,
    subjectId: id,
    parentId: optional(id),
    name: text(),
    position: z.number().int(),
  }),
  cycleItems: z.strictObject({
    id,
    examId: id,
    subjectId: id,
    minutes: z.number().int().min(1).max(24 * 60),
    order: z.number().int(),
  }),
  studySessions: z.strictObject({
    id,
    examId: id,
    subjectId: id,
    topicId: id,
    cycleItemId: optional(id),
    type: z.enum(["Teoria", "Questões", "Revisão"]),
    minutes: z.number().int().min(1).max(24 * 60),
    date,
    questions: optional(count),
    correct: optional(count),
    note: optional(text(5000)),
  }),
  reviews: z.strictObject({
    id,
    examId: id,
    topicId: id,
    sessionId: id,
    dueDate: date,
    stage: z.number().int().min(1).max(20),
    completedBySessionId: optional(id),
  }),
  weekTargets: z.strictObject({
    id,
    examId: id,
    weekStart: date,
    totalMinutes: z.number().int().min(0).max(112 * 60),
    subjects: z.array(z.strictObject({ subjectId: id, minutes: z.number().int().min(0) })).max(200),
  }),
} satisfies Record<TableName, z.ZodType>;

export type Row<T extends TableName = TableName> = z.infer<(typeof rowSchemas)[T]>;

/** Coleção do `AppData` que guarda cada tabela (as preferências ficam soltas). */
export const collectionOf = {
  exams: "exams",
  subjects: "subjects",
  topics: "topics",
  cycleItems: "cycle",
  studySessions: "sessions",
  reviews: "reviews",
  weekTargets: "weekTargets",
} as const satisfies Record<Exclude<TableName, "userSettings">, keyof AppData>;

export const settingsRow = (data: AppData): Row<"userSettings"> => ({
  id: SETTINGS_ID,
  activeExamId: data.activeExamId,
  reviewOffsets: data.reviewOffsets,
  skin: data.skin,
  seenCelebrations: data.seenCelebrations,
});
