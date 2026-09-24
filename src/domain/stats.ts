import { AppData } from "./types";

export function examProgress(data: AppData, examId: string) {
  const ids = new Set(
    data.subjects.filter((s) => s.examId === examId).map((s) => s.id),
  );
  const topics = data.topics.filter((t) => ids.has(t.subjectId));
  return topics.length
    ? Math.round((100 * topics.filter((t) => t.studied).length) / topics.length)
    : 0;
}

export function weeklyStats(data: AppData, examId: string) {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const sessions = data.sessions.filter(
    (s) => s.examId === examId && new Date(`${s.date}T12:00:00`) >= start,
  );
  const minutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const questions = sessions.reduce((sum, s) => sum + (s.questions || 0), 0);
  const correct = sessions.reduce((sum, s) => sum + (s.correct || 0), 0);
  return {
    minutes,
    questions,
    accuracy: questions ? Math.round((100 * correct) / questions) : null,
  };
}
