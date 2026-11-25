import { z } from "zod";
import { type AppData, nextPosition, type Subject, type Topic, uid } from "@meu-edital/domain";
import { nameSchema, positiveSchema } from "./parse";

const topicSchema = z.strictObject({
  name: nameSchema,
  subtopics: z.array(z.strictObject({ name: nameSchema })).max(100).optional(),
});

/** Resposta da tarefa de importação do edital. */
export const SyllabusImportSchema = z.strictObject({
  exam: nameSchema,
  role: nameSchema,
  subjects: z
    .array(
      z.strictObject({
        name: nameSchema,
        questions: z.number().int().positive().max(100_000).optional(),
        pointsPerQuestion: positiveSchema.optional(),
        weight: positiveSchema.optional(),
        topics: z.array(topicSchema).min(1).max(500),
      }),
    )
    .min(1)
    .max(50),
});
export type SyllabusImport = z.infer<typeof SyllabusImportSchema>;

const norm = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

export function validateSyllabusImport(
  data: AppData,
  examId: string,
  value: SyllabusImport,
): void {
  const exam = data.exams.find((item) => item.id === examId);
  if (!exam || norm(value.exam) !== norm(exam.name)) {
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
  const existingById = new Map(existing.map((s) => [s.id, s]));
  const subjectByName = new Map(existing.map((s) => [norm(s.name), s]));
  let nextSubjectPos = nextPosition(existing);
  const subjects: Subject[] = [];
  const topics: Topic[] = [];

  // Índice O(1) de tópicos existentes e próxima posição por (subjectId, parentId).
  const topicIndex = new Map<string, Topic>();
  const nextTopicPos = new Map<string, number>();
  const scopeKey = (subjectId: string, parentId?: string) => `${subjectId}:${parentId ?? ""}`;
  const topicKey = (subjectId: string, parentId: string | undefined, name: string) =>
    `${subjectId}:${parentId ?? ""}:${norm(name)}`;

  for (const t of data.topics) {
    topicIndex.set(topicKey(t.subjectId, t.parentId, t.name), t);
    const sk = scopeKey(t.subjectId, t.parentId);
    nextTopicPos.set(sk, Math.max(nextTopicPos.get(sk) ?? 0, t.position + 1));
  }

  for (const item of input.subjects) {
    const key = norm(item.name);
    let subject = subjectByName.get(key);
    if (!subject) {
      subject = {
        id: uid(),
        examId,
        name: item.name,
        position: nextSubjectPos++,
        ...(item.questions !== undefined
          ? { questions: item.questions, pointsPerQuestion: item.pointsPerQuestion ?? 1 }
          : item.weight !== undefined
            ? { weight: item.weight }
            : {}),
      };
      subjects.push(subject);
      subjectByName.set(key, subject);
    } else if (existingById.has(subject.id)) {
      const hasQuestions = item.questions !== undefined;
      const updated: Subject = {
        ...subject,
        weight: hasQuestions ? undefined : (item.weight ?? subject.weight),
        questions: item.weight !== undefined && !hasQuestions ? undefined : (item.questions ?? subject.questions),
        pointsPerQuestion:
          item.weight !== undefined && !hasQuestions
            ? undefined
            : hasQuestions
              ? (item.pointsPerQuestion ?? subject.pointsPerQuestion ?? 1)
              : (item.pointsPerQuestion ?? subject.pointsPerQuestion),
      };
      existingById.set(subject.id, updated);
      subjectByName.set(key, updated);
      subject = updated;
    }

    for (const entry of item.topics) {
      const rootKey = topicKey(subject.id, undefined, entry.name);
      let parent = topicIndex.get(rootKey);
      if (!parent) {
        const sk = scopeKey(subject.id, undefined);
        const pos = nextTopicPos.get(sk) ?? 0;
        nextTopicPos.set(sk, pos + 1);
        parent = { id: uid(), subjectId: subject.id, name: entry.name, position: pos };
        topics.push(parent);
        topicIndex.set(rootKey, parent);
      }
      for (const sub of entry.subtopics || []) {
        const subKey = topicKey(subject.id, parent.id, sub.name);
        if (topicIndex.has(subKey)) continue;
        const sk = scopeKey(subject.id, parent.id);
        const pos = nextTopicPos.get(sk) ?? 0;
        nextTopicPos.set(sk, pos + 1);
        const child: Topic = {
          id: uid(),
          subjectId: subject.id,
          parentId: parent.id,
          name: sub.name,
          position: pos,
        };
        topics.push(child);
        topicIndex.set(subKey, child);
      }
    }
  }
  return {
    ...data,
    subjects: [
      ...data.subjects.map((item) => existingById.get(item.id) ?? item),
      ...subjects,
    ],
    topics: [...data.topics, ...topics],
  };
}
