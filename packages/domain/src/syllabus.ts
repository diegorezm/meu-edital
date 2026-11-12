import { uid } from "./ids";
import { GENERAL_TOPIC } from "./onboarding";
import { nextPosition, subjectsInOrder } from "./topics";
import type { AppData, Exam, Subject, Topic } from "./types";

/** Campos editáveis do concurso. */
export type ExamChange = Partial<Pick<Exam, "name" | "role" | "board" | "examDate" | "hoursPerWeek">>;

export function updateExam(data: AppData, examId: string, change: ExamChange): AppData {
  return {
    ...data,
    exams: data.exams.map((exam) => (exam.id === examId ? { ...exam, ...change } : exam)),
  };
}

export function setActiveExam(data: AppData, examId: string): AppData {
  if (!data.exams.some((e) => e.id === examId) || data.activeExamId === examId) return data;
  return { ...data, activeExamId: examId };
}

/** Acrescenta uma matéria no fim do edital, com um assunto inicial para já poder estudar. */
export function addSubject(data: AppData, examId: string, name: string): AppData {
  const clean = name.trim();
  if (!clean) return data;
  const subject: Subject = {
    id: uid(),
    examId,
    name: clean,
    position: nextPosition(subjectsInOrder(data, examId)),
  };
  const topic: Topic = { id: uid(), subjectId: subject.id, name: GENERAL_TOPIC, position: 0 };
  return { ...data, subjects: [...data.subjects, subject], topics: [...data.topics, topic] };
}

/** Peso da matéria: questões × pontos, ou um peso direto (um apaga o outro). */
export type SubjectChange = Partial<Pick<Subject, "name" | "weight" | "questions" | "pointsPerQuestion">>;

export function updateSubject(data: AppData, subjectId: string, change: SubjectChange): AppData {
  return {
    ...data,
    subjects: data.subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      const next = { ...subject, ...change };
      if (change.weight !== undefined && change.weight > 0) {
        next.questions = undefined;
        next.pointsPerQuestion = undefined;
      } else if (change.questions !== undefined || change.pointsPerQuestion !== undefined) {
        next.weight = undefined;
      }
      if (typeof next.name === "string") next.name = next.name.trim() || subject.name;
      return next;
    }),
  };
}

/** Acrescenta um assunto no fim da lista dos irmãos (ou de um assunto-pai). */
export function addTopic(data: AppData, subjectId: string, name: string, parentId?: string): AppData {
  const clean = name.trim();
  if (!clean) return data;
  const siblings = data.topics.filter((t) => t.subjectId === subjectId && t.parentId === parentId);
  const topic: Topic = {
    id: uid(),
    subjectId,
    name: clean,
    position: nextPosition(siblings),
    ...(parentId ? { parentId } : {}),
  };
  return { ...data, topics: [...data.topics, topic] };
}

export function renameTopic(data: AppData, topicId: string, name: string): AppData {
  const clean = name.trim();
  if (!clean) return data;
  return { ...data, topics: data.topics.map((t) => (t.id === topicId ? { ...t, name: clean } : t)) };
}

/** Troca de lugar com o irmão de cima (-1) ou de baixo (+1). */
export function moveTopic(data: AppData, topicId: string, direction: -1 | 1): AppData {
  const topic = data.topics.find((t) => t.id === topicId);
  if (!topic) return data;
  const siblings = data.topics
    .filter((t) => t.subjectId === topic.subjectId && t.parentId === topic.parentId)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const index = siblings.findIndex((t) => t.id === topicId);
  const other = siblings[index + direction];
  if (!other) return data;
  // Renumera os irmãos para garantir posições distintas antes de trocar.
  const order = siblings.map((t) => t.id);
  [order[index], order[index + direction]] = [order[index + direction], order[index]];
  const position = new Map(order.map((id, i) => [id, i]));
  return {
    ...data,
    topics: data.topics.map((t) => (position.has(t.id) ? { ...t, position: position.get(t.id)! } : t)),
  };
}

/** Matéria para cima ou para baixo na ordem do edital. */
export function moveSubject(data: AppData, subjectId: string, direction: -1 | 1): AppData {
  const subject = data.subjects.find((s) => s.id === subjectId);
  if (!subject) return data;
  const order = subjectsInOrder(data, subject.examId).map((s) => s.id);
  const index = order.indexOf(subjectId);
  if (!order[index + direction]) return data;
  [order[index], order[index + direction]] = [order[index + direction], order[index]];
  const position = new Map(order.map((id, i) => [id, i]));
  return {
    ...data,
    subjects: data.subjects.map((s) => (position.has(s.id) ? { ...s, position: position.get(s.id)! } : s)),
  };
}

/** Intervalos das revisões, em dias, crescentes e sem repetição. */
export function setReviewOffsets(data: AppData, offsets: number[]): AppData {
  const clean = [...new Set(offsets.map((n) => Math.round(n)).filter((n) => n >= 1 && n <= 365))]
    .sort((a, b) => a - b)
    .slice(0, 6);
  return clean.length ? { ...data, reviewOffsets: clean } : data;
}

/** Quantas sessões somem ao excluir, para a confirmação dizer a verdade. */
export function sessionsAffected(
  data: AppData,
  target: { examId?: string; subjectId?: string; topicIds?: string[] },
): number {
  const topics = new Set(target.topicIds ?? []);
  return data.sessions.filter(
    (s) =>
      (target.examId && s.examId === target.examId) ||
      (target.subjectId && s.subjectId === target.subjectId) ||
      topics.has(s.topicId),
  ).length;
}

/** Assunto e todos os descendentes. */
export function topicTreeIds(data: AppData, topicId: string): string[] {
  const ids = [topicId];
  for (let i = 0; i < ids.length; i += 1)
    for (const t of data.topics) if (t.parentId === ids[i]) ids.push(t.id);
  return ids;
}
