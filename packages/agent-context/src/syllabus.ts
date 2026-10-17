import { z } from "zod";
import type { AppData, Subject, Topic } from "@meu-edital/domain";
import { uid } from "@meu-edital/domain";
import { nameSchema, positiveSchema } from "./parse";

const topicSchema = z.strictObject({
  name: nameSchema,
  subtopics: z.array(z.strictObject({ name: nameSchema })).optional(),
});

/** Resposta da tarefa de importação do edital. */
export const SyllabusImportSchema = z.strictObject({
  exam: nameSchema,
  role: nameSchema,
  subjects: z
    .array(
      z.strictObject({
        name: nameSchema,
        questions: z.number().int().positive().optional(),
        pointsPerQuestion: positiveSchema.optional(),
        weight: positiveSchema.optional(),
        topics: z.array(topicSchema).min(1),
      }),
    )
    .min(1),
});
export type SyllabusImport = z.infer<typeof SyllabusImportSchema>;

export function validateSyllabusImport(
  data: AppData,
  examId: string,
  value: SyllabusImport,
): void {
  const exam = data.exams.find((item) => item.id === examId);
  if (value.exam.toLocaleLowerCase() !== exam?.name.toLocaleLowerCase()) {
    throw new Error(
      "O nome do concurso na resposta não corresponde ao concurso ativo.",
    );
  }
}

export function importSyllabus(
  data: AppData,
  examId: string,
  input: SyllabusImport,
): AppData {
  const existing = data.subjects.filter((s) => s.examId === examId);
  const subjects: Subject[] = [];
  const topics: Topic[] = [];
  for (const item of input.subjects) {
    let subject = [...existing, ...subjects].find(
      (s) => s.name.toLocaleLowerCase() === item.name.toLocaleLowerCase(),
    );
    if (!subject) {
      subject = {
        id: uid(),
        examId,
        name: item.name,
        weight: item.weight,
        questions: item.questions,
        pointsPerQuestion: item.pointsPerQuestion,
      };
      subjects.push(subject);
    } else {
      const subjectId = subject.id;
      const index = existing.findIndex((entry) => entry.id === subjectId);
      if (index >= 0) {
        existing[index] = {
          ...subject,
          weight:
            item.questions && item.pointsPerQuestion
              ? undefined
              : (item.weight ?? subject.weight),
          questions:
            item.weight && !item.questions
              ? undefined
              : (item.questions ?? subject.questions),
          pointsPerQuestion:
            item.weight && !item.pointsPerQuestion
              ? undefined
              : (item.pointsPerQuestion ?? subject.pointsPerQuestion),
        };
      }
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
    subjects: [
      ...data.subjects.map(
        (item) => existing.find((entry) => entry.id === item.id) || item,
      ),
      ...subjects,
    ],
    topics: [...data.topics, ...topics],
  };
}
