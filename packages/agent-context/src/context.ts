import { z } from "zod";
import {
  type AppData,
  currentWeekStart,
  cycleState,
  dueReviews,
  examProgress,
  fromDateKey,
  subjectCoverage,
  subjectWeight,
  today,
  topicPath,
  topicPerformance,
  topicsInOrder,
  weekHistory,
  weeklyAllocation,
} from "@meu-edital/domain";

export const STUDY_CONTEXT_VERSION = 1;

const accuracy = z
  .number()
  .nullable()
  .describe("Percentual de acertos nas questões; null sem questões registradas.");

/**
 * Retrato do estudo para agentes externos. É um contrato público e
 * versionado: usa nomes legíveis em vez de ids e traz as métricas prontas.
 * Mudanças incompatíveis exigem incrementar `version`.
 */
export const StudyContextSchema = z.object({
  version: z.literal(STUDY_CONTEXT_VERSION),
  generatedAt: z.string().describe("Data local (AAAA-MM-DD) em que o contexto foi gerado."),
  exam: z.object({
    name: z.string(),
    role: z.string(),
    board: z.string().optional(),
    examDate: z.string().optional(),
    daysUntilExam: z.number().nullable(),
    hoursPerWeek: z.number().describe("Meta de horas de estudo por semana."),
    syllabusCoverage: z.number().describe("Percentual de assuntos do edital já estudados."),
  }),
  subjects: z.array(
    z.object({
      name: z.string(),
      weight: z.number().describe("Peso efetivo usado na distribuição do tempo."),
      questions: z.number().optional(),
      pointsPerQuestion: z.number().optional(),
      weeklyTargetMinutes: z.number(),
      coverage: z.object({ studied: z.number(), total: z.number() }),
      totalMinutes: z.number(),
      accuracy,
      topics: z
        .array(
          z.object({
            name: z.string(),
            path: z.string().describe("Assunto com seus assuntos-pai, separados por ›."),
            studied: z.boolean(),
            sessions: z.number(),
            accuracy,
            lastStudied: z.string().optional(),
          }),
        )
        .optional(),
    }),
  ),
  cycle: z.object({
    laps: z.number().describe("Voltas completas no ciclo."),
    lapMinutes: z.number(),
    nextBlock: z.object({ subject: z.string(), minutes: z.number() }).nullable(),
    blocks: z.array(z.object({ subject: z.string(), minutes: z.number() })),
  }),
  weeks: z
    .array(
      z.object({
        weekStart: z.string(),
        current: z.boolean(),
        minutes: z.number(),
        targetMinutes: z.number(),
        accuracy,
        cycleBlocks: z.number(),
        subjects: z.array(
          z.object({
            subject: z.string(),
            minutes: z.number(),
            targetMinutes: z.number(),
            accuracy,
          }),
        ),
      }),
    )
    .describe("Semanas mais recentes primeiro."),
  reviews: z.object({
    due: z.number(),
    topics: z.array(
      z.object({ topic: z.string(), subject: z.string(), dueDate: z.string() }),
    ),
  }),
  recentSessions: z.array(
    z.object({
      date: z.string(),
      subject: z.string(),
      topic: z.string(),
      type: z.string(),
      minutes: z.number(),
      questions: z.number().optional(),
      correct: z.number().optional(),
      note: z.string().optional(),
    }),
  ),
});
export type StudyContext = z.infer<typeof StudyContextSchema>;

export type StudyContextOptions = {
  weeks?: number;
  recentSessions?: number;
  includeTopics?: boolean;
  date?: string;
};

export function buildStudyContext(
  data: AppData,
  examId: string,
  {
    weeks = 4,
    recentSessions = 15,
    includeTopics = true,
    date = today(),
  }: StudyContextOptions = {},
): StudyContext {
  const exam = data.exams.find((item) => item.id === examId);
  if (!exam) throw new Error("Concurso não encontrado.");
  const subjects = data.subjects.filter((item) => item.examId === examId);
  const subjectName = (id: string) =>
    data.subjects.find((item) => item.id === id)?.name || "Matéria";
  const topicName = (id: string) => {
    const topic = data.topics.find((item) => item.id === id);
    return topic ? topicPath(data, topic) : "Assunto";
  };
  const allocation = weeklyAllocation(data, examId);
  const performance = topicPerformance(data, examId);
  const cycle = cycleState(data, examId);
  const due = dueReviews(data, examId, date);
  const history = weekHistory(data, examId, weeks, currentWeekStart());
  const examSessions = data.sessions.filter((item) => item.examId === examId);
  return {
    version: STUDY_CONTEXT_VERSION,
    generatedAt: date,
    exam: {
      name: exam.name,
      role: exam.role,
      board: exam.board || undefined,
      examDate: exam.examDate || undefined,
      daysUntilExam: exam.examDate
        ? Math.round(
            (fromDateKey(exam.examDate).getTime() - fromDateKey(date).getTime()) /
              86_400_000,
          )
        : null,
      hoursPerWeek: exam.hoursPerWeek,
      syllabusCoverage: examProgress(data, examId),
    },
    subjects: subjects.map((subject) => {
      const own = examSessions.filter((item) => item.subjectId === subject.id);
      const questions = own.reduce((sum, item) => sum + (item.questions || 0), 0);
      const correct = own.reduce((sum, item) => sum + (item.correct || 0), 0);
      const coverage = subjectCoverage(data, subject.id);
      return {
        name: subject.name,
        weight: subjectWeight(subject),
        questions: subject.questions,
        pointsPerQuestion: subject.pointsPerQuestion,
        weeklyTargetMinutes:
          allocation.find((item) => item.subjectId === subject.id)?.minutes || 0,
        coverage: { studied: coverage.studied, total: coverage.total },
        totalMinutes: own.reduce((sum, item) => sum + item.minutes, 0),
        accuracy: questions ? Math.round((100 * correct) / questions) : null,
        topics: includeTopics
          ? topicsInOrder(data, subject.id).map((topic) => {
              const row = performance.find((item) => item.topic.id === topic.id);
              return {
                name: topic.name,
                path: topicPath(data, topic),
                studied: topic.studied,
                sessions: row?.sessions || 0,
                accuracy: row?.accuracy ?? null,
                lastStudied: row?.lastStudied,
              };
            })
          : undefined,
      };
    }),
    cycle: {
      laps: cycle.laps,
      lapMinutes: cycle.lapMinutes,
      nextBlock: cycle.next
        ? { subject: subjectName(cycle.next.subjectId), minutes: cycle.next.minutes }
        : null,
      blocks: cycle.items.map((item) => ({
        subject: subjectName(item.subjectId),
        minutes: item.minutes,
      })),
    },
    weeks: history.map((week) => ({
      weekStart: week.weekStart,
      current: week.current,
      minutes: week.minutes,
      targetMinutes: week.targetMinutes,
      accuracy: week.accuracy,
      cycleBlocks: week.cycleBlocks,
      subjects: week.subjects.map((item) => ({
        subject: item.name,
        minutes: item.minutes,
        targetMinutes: item.targetMinutes,
        accuracy: item.accuracy,
      })),
    })),
    reviews: {
      due: due.length,
      topics: due.slice(0, 20).map((review) => {
        const topic = data.topics.find((item) => item.id === review.topicId);
        return {
          topic: topicName(review.topicId),
          subject: topic ? subjectName(topic.subjectId) : "Matéria",
          dueDate: review.dueDate,
        };
      }),
    },
    recentSessions: [...examSessions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, recentSessions)
      .map((session) => ({
        date: session.date,
        subject: subjectName(session.subjectId),
        topic: topicName(session.topicId),
        type: session.type,
        minutes: session.minutes,
        questions: session.questions,
        correct: session.correct,
        note: session.note,
      })),
  };
}
