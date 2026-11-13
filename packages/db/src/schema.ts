import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { StudyType } from "@meu-edital/domain";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;
const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" });

// --- Conta (Better Auth). Os nomes das propriedades seguem o Better Auth. ---

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().default(now),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(now)
    .$onUpdate(() => new Date()),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().default(now),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(now)
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().default(now),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(now)
      .$onUpdate(() => new Date()),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().default(now),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(now)
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// --- Dados de estudo ---
//
// Toda linha pertence a um usuário e carrega os campos de sincronização:
// `updatedAt` (ms), `deletedAt` (exclusão lógica, para propagar a outros
// aparelhos) e `version`, um contador crescente por usuário atribuído pelo
// servidor. Não há chaves estrangeiras entre tabelas de estudo: o sync usa
// "vence a última escrita" por linha e as mutações podem chegar fora de ordem.
// Só `userId` aponta para `user`, para a exclusão da conta apagar tudo.

const owned = () => ({
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  updatedAt: integer("updated_at").notNull(),
  deletedAt: integer("deleted_at"),
  version: integer("version").notNull(),
});

export const exams = sqliteTable(
  "exams",
  {
    ...owned(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    board: text("board"),
    examDate: text("exam_date"),
    hoursPerWeek: real("hours_per_week").notNull(),
    createdAt: text("created_at").notNull(),
    cyclePosition: integer("cycle_position").notNull().default(0),
    cycleLaps: integer("cycle_laps").notNull().default(0),
    lastCycleSessionId: text("last_cycle_session_id"),
  },
  (t) => [index("exams_user_version_idx").on(t.userId, t.version)],
);

export const subjects = sqliteTable(
  "subjects",
  {
    ...owned(),
    examId: text("exam_id").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    weight: real("weight"),
    questions: integer("questions"),
    pointsPerQuestion: real("points_per_question"),
  },
  (t) => [index("subjects_user_version_idx").on(t.userId, t.version)],
);

export const topics = sqliteTable(
  "topics",
  {
    ...owned(),
    subjectId: text("subject_id").notNull(),
    parentId: text("parent_id"),
    name: text("name").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [index("topics_user_version_idx").on(t.userId, t.version)],
);

export const cycleItems = sqliteTable(
  "cycle_items",
  {
    ...owned(),
    examId: text("exam_id").notNull(),
    subjectId: text("subject_id").notNull(),
    minutes: integer("minutes").notNull(),
    order: integer("sort_order").notNull(),
  },
  (t) => [index("cycle_items_user_version_idx").on(t.userId, t.version)],
);

export const studySessions = sqliteTable(
  "study_sessions",
  {
    ...owned(),
    examId: text("exam_id").notNull(),
    subjectId: text("subject_id").notNull(),
    topicId: text("topic_id").notNull(),
    cycleItemId: text("cycle_item_id"),
    type: text("type").$type<StudyType>().notNull(),
    minutes: integer("minutes").notNull(),
    date: text("date").notNull(),
    questions: integer("questions"),
    correct: integer("correct"),
    note: text("note"),
  },
  (t) => [
    index("study_sessions_user_version_idx").on(t.userId, t.version),
    index("study_sessions_user_date_idx").on(t.userId, t.date),
  ],
);

export const reviews = sqliteTable(
  "reviews",
  {
    ...owned(),
    examId: text("exam_id").notNull(),
    topicId: text("topic_id").notNull(),
    sessionId: text("session_id").notNull(),
    dueDate: text("due_date").notNull(),
    stage: integer("stage").notNull(),
    completedBySessionId: text("completed_by_session_id"),
    shiftedBySessionId: text("shifted_by_session_id"),
    shiftDays: integer("shift_days"),
  },
  (t) => [index("reviews_user_version_idx").on(t.userId, t.version)],
);

export const weekTargets = sqliteTable(
  "week_targets",
  {
    ...owned(),
    examId: text("exam_id").notNull(),
    weekStart: text("week_start").notNull(),
    totalMinutes: integer("total_minutes").notNull(),
    subjects: text("subjects", { mode: "json" })
      .$type<{ subjectId: string; minutes: number }[]>()
      .notNull(),
  },
  (t) => [index("week_targets_user_version_idx").on(t.userId, t.version)],
);

export const mockExams = sqliteTable(
  "mock_exams",
  {
    ...owned(),
    examId: text("exam_id").notNull(),
    date: text("date").notNull(),
    title: text("title").notNull(),
    lap: integer("lap").notNull(),
    subjects: text("subjects", { mode: "json" })
      .$type<{ subjectId: string; questions: number; correct: number }[]>()
      .notNull(),
  },
  (t) => [index("mock_exams_user_version_idx").on(t.userId, t.version)],
);

/** Preferências do usuário. Uma linha por usuário; o id é o próprio `userId`. */
export const userSettings = sqliteTable(
  "user_settings",
  {
    ...owned(),
    activeExamId: text("active_exam_id"),
    reviewOffsets: text("review_offsets", { mode: "json" }).$type<number[]>().notNull(),
    skin: text("skin").notNull().default("rosa"),
    seenCelebrations: text("seen_celebrations", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
  },
  (t) => [index("user_settings_user_version_idx").on(t.userId, t.version)],
);

/** Último `version` atribuído a cada usuário. O próximo é sempre este + 1. */
export const syncCounters = sqliteTable("sync_counters", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(0),
});

/**
 * Mutações já aplicadas, por id, para que reenviar um lote não aplique nada
 * duas vezes. Linhas antigas podem ser apagadas: um aparelho não reenvia
 * mutações depois de recebê-las como aceitas.
 */
export const syncMutations = sqliteTable(
  "sync_mutations",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mutationId: text("mutation_id").notNull(),
    appliedAt: integer("applied_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.mutationId] }),
    index("sync_mutations_applied_idx").on(t.appliedAt),
  ],
);

/**
 * Caixa de propostas do Oráculo. Não sincroniza pelo protocolo de linhas: o
 * servidor cria (pelo MCP ou por resposta colada) e o app aplica pelo
 * domínio. Pendentes expiram em 7 dias.
 */
export const proposals = sqliteTable(
  "proposals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    examId: text("exam_id").notNull(),
    source: text("source").$type<"mcp" | "colar">().notNull(),
    author: text("author").notNull(),
    reason: text("reason").notNull(),
    payload: text("payload", { mode: "json" }).notNull(),
    status: text("status").$type<"pendente" | "aplicada" | "descartada">().notNull().default("pendente"),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [index("proposals_user_status_idx").on(t.userId, t.status)],
);

/** Assinaturas de Web Push (um registro por navegador). */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    endpoint: text("endpoint").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("push_subscriptions_user_idx").on(t.userId)],
);

/** Tabelas de estudo, na ordem pais antes dos filhos. */
export const studyTables = {
  exams,
  subjects,
  topics,
  cycleItems,
  studySessions,
  reviews,
  weekTargets,
  mockExams,
  userSettings,
} as const;
export type StudyTableName = keyof typeof studyTables;
