import type {
  AppData,
  CycleItem,
  Exam,
  Review,
  StudySession,
  StudyType,
  Subject,
  Topic,
} from "@meu-edital/domain";
import { emptyData } from "@meu-edital/domain";

export type Row = Record<string, unknown> & { id: string };
export type TableName =
  | "exams"
  | "subjects"
  | "topics"
  | "cycle_items"
  | "study_sessions"
  | "reviews";

type Table<T> = {
  name: TableName;
  rows: (data: AppData) => T[];
  toRow: (item: T) => Row;
  fromRow: (row: any) => T;
  order: { column: string; ascending: boolean };
};

const optional = <T,>(value: T | null | undefined) =>
  value === null || value === undefined ? undefined : value;

const exams: Table<Exam> = {
  name: "exams",
  rows: (data) => data.exams,
  toRow: (item) => ({
    id: item.id,
    name: item.name,
    role: item.role,
    board: item.board || null,
    exam_date: item.examDate || null,
    hours_per_week: item.hoursPerWeek,
    cycle_position: item.cyclePosition || 0,
    cycle_laps: item.cycleLaps || 0,
    created_at: item.createdAt,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    board: optional(row.board),
    examDate: optional(row.exam_date),
    hoursPerWeek: Number(row.hours_per_week),
    cyclePosition: row.cycle_position,
    cycleLaps: row.cycle_laps,
    createdAt: row.created_at,
  }),
  order: { column: "id", ascending: true },
};

const subjects: Table<Subject> = {
  name: "subjects",
  rows: (data) => data.subjects,
  toRow: (item) => ({
    id: item.id,
    exam_id: item.examId,
    name: item.name,
    weight: item.weight ?? null,
    questions: item.questions ?? null,
    points_per_question: item.pointsPerQuestion ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    examId: row.exam_id,
    name: row.name,
    weight: optional(row.weight) === undefined ? undefined : Number(row.weight),
    questions: optional(row.questions),
    pointsPerQuestion:
      optional(row.points_per_question) === undefined
        ? undefined
        : Number(row.points_per_question),
  }),
  order: { column: "id", ascending: true },
};

const topics: Table<Topic> = {
  name: "topics",
  rows: (data) => data.topics,
  toRow: (item) => ({
    id: item.id,
    subject_id: item.subjectId,
    parent_id: item.parentId ?? null,
    name: item.name,
    studied: item.studied,
  }),
  fromRow: (row) => ({
    id: row.id,
    subjectId: row.subject_id,
    parentId: optional(row.parent_id),
    name: row.name,
    studied: row.studied,
  }),
  order: { column: "id", ascending: true },
};

const cycleItems: Table<CycleItem> = {
  name: "cycle_items",
  rows: (data) => data.cycle,
  toRow: (item) => ({
    id: item.id,
    exam_id: item.examId,
    subject_id: item.subjectId,
    minutes: item.minutes,
    sort_order: item.order,
  }),
  fromRow: (row) => ({
    id: row.id,
    examId: row.exam_id,
    subjectId: row.subject_id,
    minutes: row.minutes,
    order: row.sort_order,
  }),
  order: { column: "sort_order", ascending: true },
};

const sessions: Table<StudySession> = {
  name: "study_sessions",
  rows: (data) => data.sessions,
  toRow: (item) => ({
    id: item.id,
    exam_id: item.examId,
    subject_id: item.subjectId,
    topic_id: item.topicId,
    cycle_item_id: item.cycleItemId ?? null,
    type: item.type,
    minutes: item.minutes,
    date: item.date,
    questions: item.questions ?? null,
    correct: item.correct ?? null,
    note: item.note ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    examId: row.exam_id,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    cycleItemId: optional(row.cycle_item_id),
    type: row.type as StudyType,
    minutes: row.minutes,
    date: row.date,
    questions: optional(row.questions),
    correct: optional(row.correct),
    note: optional(row.note),
  }),
  // O domínio mantém as sessões mais recentes primeiro.
  order: { column: "id", ascending: false },
};

const reviews: Table<Review> = {
  name: "reviews",
  rows: (data) => data.reviews,
  toRow: (item) => ({
    id: item.id,
    exam_id: item.examId,
    topic_id: item.topicId,
    due_date: item.dueDate,
    completed: item.completed,
    stage: item.stage,
  }),
  fromRow: (row) => ({
    id: row.id,
    examId: row.exam_id,
    topicId: row.topic_id,
    dueDate: row.due_date,
    completed: row.completed,
    stage: row.stage,
  }),
  order: { column: "id", ascending: true },
};

/** Tabelas na ordem de dependência: pais antes dos filhos. */
export const tables = [
  exams,
  subjects,
  topics,
  cycleItems,
  sessions,
  reviews,
] as Table<any>[];

export type SettingsRow = {
  user_id: string;
  active_exam_id: string | null;
  review_offsets: number[];
};

export const settingsRow = (data: AppData, userId: string): SettingsRow => ({
  user_id: userId,
  active_exam_id: data.activeExamId,
  review_offsets: data.reviewOffsets,
});

export function fromRemote(
  rows: Record<TableName, any[]>,
  settings: SettingsRow | null,
): AppData {
  const empty = emptyData();
  const read = <T,>(name: TableName) => {
    const table = tables.find((item) => item.name === name)!;
    return (rows[name] || []).map((row) => table.fromRow(row) as T);
  };
  const exams = read<Exam>("exams");
  const activeExamId =
    settings?.active_exam_id &&
    exams.some((exam) => exam.id === settings.active_exam_id)
      ? settings.active_exam_id
      : exams[0]?.id || null;
  return {
    ...empty,
    exams,
    subjects: read<Subject>("subjects"),
    topics: read<Topic>("topics"),
    cycle: read<CycleItem>("cycle_items"),
    sessions: read<StudySession>("study_sessions"),
    reviews: read<Review>("reviews"),
    activeExamId,
    reviewOffsets: settings?.review_offsets?.length
      ? settings.review_offsets
      : empty.reviewOffsets,
  };
}
