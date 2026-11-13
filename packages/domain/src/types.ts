import type { SkinId } from "./game/constants";

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
  cyclePosition: number;
  /** Voltas completas no ciclo. */
  cycleLaps: number;
  /**
   * Última sessão que avançou o ciclo. Excluir essa sessão devolve a jornada
   * ao bloco dela; excluir qualquer outra não mexe na posição.
   */
  lastCycleSessionId?: string;
};

export type Subject = {
  id: string;
  examId: string;
  name: string;
  /** Ordem no edital, crescente. */
  position: number;
  /** Total de pontos ou proporção, quando o edital não detalha questões. */
  weight?: number;
  questions?: number;
  pointsPerQuestion?: number;
};

/**
 * Item do conteúdo programático. "Estudado" não é guardado: um assunto está
 * estudado quando tem ao menos uma sessão (`isTopicStudied`).
 */
export type Topic = {
  id: string;
  subjectId: string;
  parentId?: string;
  name: string;
  /** Ordem entre os irmãos (mesmo `parentId`), crescente. */
  position: number;
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
  /** Sessão que agendou a revisão. Excluir a sessão exclui a revisão. */
  sessionId: string;
  dueDate: string;
  stage: number;
  /** Sessão de revisão que concluiu esta revisão. Excluí-la reabre a revisão. */
  completedBySessionId?: string;
  /**
   * Revisão adaptativa: a sessão de revisão que adiantou ou adiou esta data,
   * e em quantos dias. Excluir a sessão desfaz o ajuste.
   */
  shiftedBySessionId?: string;
  shiftDays?: number;
};

/** Bloco do ciclo: uma matéria e o tempo dedicado a ela. O assunto é escolhido na sessão. */
export type CycleItem = {
  id: string;
  examId: string;
  subjectId: string;
  minutes: number;
  order: number;
};

/**
 * Retrato da meta de uma semana, salvo quando a semana começa. Mantém o
 * histórico estável mesmo que a meta ou os pesos mudem depois.
 */
export type WeekTarget = {
  id: string;
  examId: string;
  /** Segunda-feira da semana, AAAA-MM-DD. */
  weekStart: string;
  totalMinutes: number;
  subjects: { subjectId: string; minutes: number }[];
};

/** Simulado: prova completa registrada, com questões e acertos por matéria. É o chefe da volta. */
export type MockExam = {
  id: string;
  examId: string;
  date: string;
  title: string;
  /** Volta da jornada em que foi feito (para o chefe da volta). */
  lap: number;
  subjects: { subjectId: string; questions: number; correct: number }[];
};

export type AppData = {
  version: 3;
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  sessions: StudySession[];
  reviews: Review[];
  cycle: CycleItem[];
  weekTargets: WeekTarget[];
  mockExams: MockExam[];
  activeExamId: string | null;
  reviewOffsets: number[];
  /** Skin escolhida para o mascote (cosmético). */
  skin: SkinId;
  /** Ids das comemorações já vistas, para não repetir em outro aparelho. */
  seenCelebrations: string[];
};

export const emptyData = (): AppData => ({
  version: 3,
  exams: [],
  subjects: [],
  topics: [],
  sessions: [],
  reviews: [],
  cycle: [],
  weekTargets: [],
  mockExams: [],
  activeExamId: null,
  reviewOffsets: [1, 7, 30],
  skin: "rosa",
  seenCelebrations: [],
});
