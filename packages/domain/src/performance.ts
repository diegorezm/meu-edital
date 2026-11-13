import { subjectsInOrder, topicPath, topicsInOrder } from "./topics";
import type { AppData } from "./types";

type Totals = { minutes: number; sessions: number; questions: number; correct: number; lastStudied?: string };

const empty = (): Totals => ({ minutes: 0, sessions: 0, questions: 0, correct: 0 });

function add(totals: Totals, session: AppData["sessions"][number]) {
  totals.minutes += session.minutes;
  totals.sessions += 1;
  totals.questions += session.questions ?? 0;
  totals.correct += session.correct ?? 0;
  if (!totals.lastStudied || session.date > totals.lastStudied) totals.lastStudied = session.date;
}

const accuracy = (t: Totals) => (t.questions ? t.correct / t.questions : null);

/**
 * Desempenho por matéria e por assunto: tempo, sessões, questões,
 * aproveitamento e último estudo. Assuntos na ordem do edital.
 */
export function performanceBySubject(data: AppData, examId: string) {
  const bySubject = new Map<string, Totals>();
  const byTopic = new Map<string, Totals>();
  for (const session of data.sessions) {
    if (session.examId !== examId) continue;
    const s = bySubject.get(session.subjectId) ?? empty();
    add(s, session);
    bySubject.set(session.subjectId, s);
    const t = byTopic.get(session.topicId) ?? empty();
    add(t, session);
    byTopic.set(session.topicId, t);
  }
  return subjectsInOrder(data, examId).map((subject) => {
    const totals = bySubject.get(subject.id) ?? empty();
    return {
      subjectId: subject.id,
      name: subject.name,
      ...totals,
      accuracy: accuracy(totals),
      topics: topicsInOrder(data, subject.id).map((topic) => {
        const t = byTopic.get(topic.id) ?? empty();
        return { topicId: topic.id, name: topicPath(data, topic), ...t, accuracy: accuracy(t) };
      }),
    };
  });
}
