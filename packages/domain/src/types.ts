export type StudyType = "Teoria" | "Questões" | "Revisão";

export type Exam = {
  id: string;
  name: string;
  role: string;
  board?: string;
  examDate?: string;
  hoursPerWeek: number;
  createdAt: string;
  /** Índice do próximo bloco do ciclo. */
  cyclePosition?: number;
  /** Voltas completas no ciclo. */
  cycleLaps?: number;
};
export type Subject = {
  id: string;
  examId: string;
  name: string;
  /** Total de pontos ou proporção, quando o edital não detalha questões. */
  weight?: number;
  questions?: number;
  pointsPerQuestion?: number;
};
export type Topic = {
  id: string;
  subjectId: string;
  parentId?: string;
  name: string;
  studied: boolean;
};
export type StudySession = {
  id: string;
  examId: string;
  subjectId: string;
  topicId: string;
  /** Bloco do ciclo que originou a sessão, quando houver. */
  cycleItemId?: string;
  type: StudyType;
  minutes: number;
  date: string;
  questions?: number;
  correct?: number;
  note?: string;
};
export type Review = {
  id: string;
  examId: string;
  topicId: string;
  dueDate: string;
  completed: boolean;
  stage: number;
};
/** Bloco do ciclo: uma matéria e o tempo dedicado a ela. O assunto é escolhido na sessão. */
export type CycleItem = {
  id: string;
  examId: string;
  subjectId: string;
  minutes: number;
  order: number;
};
export type AppData = {
  version: 2;
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  sessions: StudySession[];
  reviews: Review[];
  cycle: CycleItem[];
  activeExamId: string | null;
  reviewOffsets: number[];
};

export const emptyData = (): AppData => ({
  version: 2,
  exams: [],
  subjects: [],
  topics: [],
  sessions: [],
  reviews: [],
  cycle: [],
  activeExamId: null,
  reviewOffsets: [1, 7, 30],
});

let lastTime = 0;
let sequence = 0;
/**
 * Id gerado no próprio dispositivo. A ordem alfabética dos ids segue a ordem
 * de criação, o que preserva a ordem do edital ao sincronizar.
 */
export const uid = () => {
  const now = Date.now();
  sequence = now === lastTime ? sequence + 1 : 0;
  lastTime = now;
  return `${now}-${sequence.toString(36).padStart(3, "0")}${Math.random().toString(36).slice(2, 8)}`;
};

/** Data local no formato AAAA-MM-DD. */
export const toDateKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
export const fromDateKey = (date: string) => new Date(`${date}T12:00:00`);
export const today = () => toDateKey(new Date());
export const addDays = (date: string, days: number) => {
  const d = fromDateKey(date);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
};
export const weekStartOf = (date: string) => {
  const d = fromDateKey(date);
  return addDays(date, -((d.getDay() + 6) % 7));
};
export const currentWeekStart = () => weekStartOf(today());
/** Dias de `from` até `date`. Negativo quando a data já passou. */
export const daysUntil = (date: string, from = today()) =>
  Math.round(
    (fromDateKey(date).getTime() - fromDateKey(from).getTime()) / 86_400_000,
  );
export const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
