import { weeklyAllocation } from "./allocation";
import type { AppData, Review, StudySession, Topic } from "./types";
import { addDays, currentWeekStart, today } from "./types";

const accuracyOf = (questions: number, correct: number) =>
  questions ? Math.round((100 * correct) / questions) : null;

function examSubjectIds(data: AppData, examId: string) {
  return new Set(
    data.subjects.filter((s) => s.examId === examId).map((s) => s.id),
  );
}

/** Percentual de assuntos do edital já estudados. */
export function examProgress(data: AppData, examId: string) {
  const ids = examSubjectIds(data, examId);
  const topics = data.topics.filter((t) => ids.has(t.subjectId));
  return topics.length
    ? Math.round((100 * topics.filter((t) => t.studied).length) / topics.length)
    : 0;
}

export function subjectCoverage(data: AppData, subjectId: string) {
  const topics = data.topics.filter((t) => t.subjectId === subjectId);
  const studied = topics.filter((t) => t.studied).length;
  return {
    studied,
    total: topics.length,
    percent: topics.length ? Math.round((100 * studied) / topics.length) : 0,
  };
}

export type SubjectWeek = {
  subjectId: string;
  name: string;
  targetMinutes: number;
  minutes: number;
  sessions: number;
  questions: number;
  correct: number;
  accuracy: number | null;
};

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  /** Semana em andamento (a meta ainda pode ser alcançada). */
  current: boolean;
  minutes: number;
  targetMinutes: number;
  sessions: number;
  questions: number;
  accuracy: number | null;
  cycleBlocks: number;
  days: { date: string; minutes: number }[];
  subjects: SubjectWeek[];
};

export function sessionsBetween(
  data: AppData,
  examId: string,
  start: string,
  end: string,
): StudySession[] {
  return data.sessions.filter(
    (s) => s.examId === examId && s.date >= start && s.date <= end,
  );
}

export type MonthSummary = {
  /** Primeiro dia do mês, AAAA-MM-01. */
  monthStart: string;
  /** Sessões do mês, das mais recentes para as mais antigas. */
  sessions: StudySession[];
  minutes: number;
};

/** Diário do mês: as sessões do concurso no mês de `date`, com o total de tempo. */
export function monthSummary(
  data: AppData,
  examId: string,
  date = today(),
): MonthSummary {
  const monthStart = `${date.slice(0, 7)}-01`;
  const sessions = sessionsBetween(data, examId, monthStart, `${date.slice(0, 7)}-31`)
    .slice()
    .sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1));
  return {
    monthStart,
    sessions,
    minutes: sessions.reduce((sum, s) => sum + s.minutes, 0),
  };
}

/** Resumo do que foi estudado na semana, comparado com a meta de cada matéria. */
export function weekSummary(
  data: AppData,
  examId: string,
  weekStart = currentWeekStart(),
): WeekSummary {
  const weekEnd = addDays(weekStart, 6);
  const sessions = sessionsBetween(data, examId, weekStart, weekEnd);
  const allocation = weeklyAllocation(data, examId);
  const subjects = data.subjects
    .filter((s) => s.examId === examId)
    .map((subject): SubjectWeek => {
      const own = sessions.filter((s) => s.subjectId === subject.id);
      const questions = own.reduce((sum, s) => sum + (s.questions || 0), 0);
      const correct = own.reduce((sum, s) => sum + (s.correct || 0), 0);
      return {
        subjectId: subject.id,
        name: subject.name,
        targetMinutes:
          allocation.find((a) => a.subjectId === subject.id)?.minutes || 0,
        minutes: own.reduce((sum, s) => sum + s.minutes, 0),
        sessions: own.length,
        questions,
        correct,
        accuracy: accuracyOf(questions, correct),
      };
    });
  const questions = subjects.reduce((sum, s) => sum + s.questions, 0);
  const correct = subjects.reduce((sum, s) => sum + s.correct, 0);
  const exam = data.exams.find((e) => e.id === examId);
  const now = today();
  return {
    weekStart,
    weekEnd,
    current: weekStart <= now && now <= weekEnd,
    minutes: sessions.reduce((sum, s) => sum + s.minutes, 0),
    targetMinutes: Math.round((exam?.hoursPerWeek || 0) * 60),
    sessions: sessions.length,
    questions,
    accuracy: accuracyOf(questions, correct),
    cycleBlocks: sessions.filter((s) => s.cycleItemId).length,
    days: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return {
        date,
        minutes: sessions
          .filter((s) => s.date === date)
          .reduce((sum, s) => sum + s.minutes, 0),
      };
    }),
    subjects,
  };
}

/** Semanas mais recentes primeiro, começando pela semana informada. */
export function weekHistory(
  data: AppData,
  examId: string,
  count = 4,
  from = currentWeekStart(),
): WeekSummary[] {
  return Array.from({ length: count }, (_, index) =>
    weekSummary(data, examId, addDays(from, -7 * index)),
  );
}

/** Matérias abaixo de 75% da meta na semana. */
export function subjectsBehind(week: WeekSummary) {
  return week.subjects
    .filter((s) => s.targetMinutes > 0 && s.minutes < s.targetMinutes * 0.75)
    .sort(
      (a, b) => a.minutes / a.targetMinutes - b.minutes / b.targetMinutes,
    );
}

export function dueReviews(data: AppData, examId: string, date = today()) {
  return data.reviews
    .filter((r) => r.examId === examId && !r.completed && r.dueDate <= date)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export type TopicPerformance = {
  topic: Topic;
  sessions: number;
  minutes: number;
  questions: number;
  accuracy: number | null;
  lastStudied?: string;
};

export function topicPerformance(
  data: AppData,
  examId: string,
): TopicPerformance[] {
  const ids = examSubjectIds(data, examId);
  const totals = new Map<string, Omit<TopicPerformance, "topic" | "accuracy"> & { correct: number }>();
  for (const session of data.sessions) {
    const current = totals.get(session.topicId) || {
      sessions: 0,
      minutes: 0,
      questions: 0,
      correct: 0,
    };
    current.sessions += 1;
    current.minutes += session.minutes;
    current.questions += session.questions || 0;
    current.correct += session.correct || 0;
    if (!current.lastStudied || session.date > current.lastStudied)
      current.lastStudied = session.date;
    totals.set(session.topicId, current);
  }
  return data.topics
    .filter((t) => ids.has(t.subjectId))
    .map((topic) => {
      const { correct, ...rest } = totals.get(topic.id) || {
        sessions: 0,
        minutes: 0,
        questions: 0,
        correct: 0,
      };
      return { topic, ...rest, accuracy: accuracyOf(rest.questions, correct) };
    });
}

export function reviewTopicName(data: AppData, review: Review) {
  return data.topics.find((t) => t.id === review.topicId)?.name || "Assunto";
}
