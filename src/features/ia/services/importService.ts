import type { AppData, PlannedSession, Subject, Topic } from "@domain/types";
import { currentWeekStart, uid, weekdays } from "@domain/types";
import type { ExamImport, WeeklyPlanImport } from "../schemas/aiImportSchema";

export function validateExamImport(
  data: AppData,
  examId: string,
  value: ExamImport,
): void {
  const exam = data.exams.find((item) => item.id === examId);
  if (value.exam.toLocaleLowerCase() !== exam?.name.toLocaleLowerCase()) {
    throw new Error(
      "O nome do concurso na resposta não corresponde ao concurso ativo.",
    );
  }
}

export function importExam(
  data: AppData,
  examId: string,
  input: ExamImport,
): AppData {
  const existing = data.subjects.filter((s) => s.examId === examId);
  const subjects: Subject[] = [];
  const topics: Topic[] = [];
  for (const item of input.subjects) {
    let subject = [...existing, ...subjects].find(
      (s) => s.name.toLocaleLowerCase() === item.name.toLocaleLowerCase(),
    );
    if (!subject) {
      subject = { id: uid(), examId, name: item.name };
      subjects.push(subject);
    }
    for (const entry of item.topics) {
      const exists = [...data.topics, ...topics].find(
        (t) =>
          t.subjectId === subject.id &&
          !t.parentId &&
          t.name.toLocaleLowerCase() === entry.name.toLocaleLowerCase(),
      );
      const parent = exists || {
        id: uid(),
        subjectId: subject.id,
        name: entry.name,
        studied: false,
      };
      if (!exists) topics.push(parent);
      for (const sub of entry.subtopics || []) {
        if (
          ![...data.topics, ...topics].some(
            (t) =>
              t.parentId === parent.id &&
              t.name.toLocaleLowerCase() === sub.name.toLocaleLowerCase(),
          )
        )
          topics.push({
            id: uid(),
            subjectId: subject.id,
            parentId: parent.id,
            name: sub.name,
            studied: false,
          });
      }
    }
  }
  return {
    ...data,
    subjects: [...data.subjects, ...subjects],
    topics: [...data.topics, ...topics],
  };
}

export function resolveWeeklyPlan(
  data: AppData,
  examId: string,
  input: WeeklyPlanImport,
): PlannedSession[] {
  return input.sessions.map((row, order) => {
    const subject = data.subjects.find(
      (s) =>
        s.examId === examId &&
        s.name.toLocaleLowerCase() === row.subject.toLocaleLowerCase(),
    );
    if (!subject)
      throw new Error(
        `Não encontramos a matéria '${row.subject}'. Verifique o conteúdo antes de importar.`,
      );
    const matches = data.topics.filter(
      (t) =>
        t.subjectId === subject.id &&
        t.name.toLocaleLowerCase() === row.topic.toLocaleLowerCase(),
    );
    const topic = matches[0];
    if (!topic)
      throw new Error(
        `Não encontramos o assunto '${row.topic}' em ${subject.name}.`,
      );
    if (matches.length > 1)
      throw new Error(
        `O assunto '${row.topic}' aparece mais de uma vez em ${subject.name}. Renomeie os assuntos para importar este plano.`,
      );
    return {
      id: uid(),
      examId,
      weekStart: currentWeekStart(),
      day: weekdays.indexOf(row.day) as PlannedSession["day"],
      subjectId: subject.id,
      topicId: topic.id,
      type: row.type,
      minutes: row.minutes,
      order,
      completed: false,
    };
  });
}

export function applyWeekImport(
  data: AppData,
  examId: string,
  sessions: PlannedSession[],
): AppData {
  const weekStart = currentWeekStart();
  return {
    ...data,
    planned: [
      ...data.planned.filter(
        (item) => item.examId !== examId || item.weekStart !== weekStart,
      ),
      ...sessions,
    ],
  };
}
