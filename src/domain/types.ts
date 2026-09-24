export type StudyType = "Teoria" | "Questões" | "Revisão";
export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Exam = {
  id: string;
  name: string;
  role: string;
  board?: string;
  examDate?: string;
  hoursPerWeek: number;
  createdAt: string;
};
export type Subject = { id: string; examId: string; name: string };
export type Topic = {
  id: string;
  subjectId: string;
  parentId?: string;
  name: string;
  studied: boolean;
};
export type PlannedSession = {
  id: string;
  examId: string;
  weekStart: string;
  day: Day;
  subjectId: string;
  topicId: string;
  type: StudyType;
  minutes: number;
  order: number;
  completed: boolean;
};
export type StudySession = {
  id: string;
  examId: string;
  subjectId: string;
  topicId: string;
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
export type CycleItem = {
  id: string;
  examId: string;
  subjectId: string;
  topicId: string;
  type: StudyType;
  minutes: number;
  order: number;
};
export type AppData = {
  version: 1;
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  planned: PlannedSession[];
  sessions: StudySession[];
  reviews: Review[];
  cycle: CycleItem[];
  cyclePosition: Record<string, number>;
  activeExamId: string | null;
  reviewOffsets: number[];
};

export const uid = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
export const mondayOf = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};
export const currentWeekStart = () => mondayOf().toISOString().slice(0, 10);
export const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
