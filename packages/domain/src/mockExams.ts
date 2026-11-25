import { today } from "./dates";
import { uid } from "./ids";
import { subjectsInOrder } from "./topics";
import type { AppData, MockExam } from "./types";

export type MockExamInput = Omit<MockExam, "id">;

/** Registra um simulado (o chefe da volta). Linhas de matéria sem questões são ignoradas. */
export function recordMockExam(data: AppData, input: MockExamInput): AppData {
  const merged = new Map<string, { subjectId: string; questions: number; correct: number }>();
  for (const row of input.subjects) {
    const q = Number.isFinite(row.questions) ? Math.min(100_000, Math.round(row.questions)) : 0;
    if (q <= 0) continue;
    const c = Number.isFinite(row.correct) ? Math.max(0, Math.min(Math.round(row.correct), q)) : 0;
    const prev = merged.get(row.subjectId);
    if (prev) {
      prev.questions = Math.min(100_000, prev.questions + q);
      prev.correct = Math.min(prev.questions, prev.correct + c);
    } else {
      merged.set(row.subjectId, { subjectId: row.subjectId, questions: q, correct: c });
    }
  }
  const subjects = [...merged.values()];
  if (!subjects.length) return data;
  const entry: MockExam = {
    ...input,
    title: (input.title.trim() || "Simulado").slice(0, 200),
    subjects,
    id: uid(),
  };
  return { ...data, mockExams: [...data.mockExams, entry] };
}

export function deleteMockExam(data: AppData, id: string): AppData {
  return { ...data, mockExams: data.mockExams.filter((m) => m.id !== id) };
}

/** Aproveitamento do simulado, de 0 a 1. */
export function mockExamScore(mock: MockExam): number {
  const questions = mock.subjects.reduce((sum, s) => sum + s.questions, 0);
  const correct = mock.subjects.reduce((sum, s) => sum + s.correct, 0);
  return questions ? correct / questions : 0;
}

/** Simulados do concurso em ordem de data, com a nota e a evolução por matéria. */
export function mockExamHistory(data: AppData, examId: string) {
  const order = subjectsInOrder(data, examId);
  const mocks = data.mockExams
    .filter((m) => m.examId === examId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return {
    mocks: mocks.map((mock) => ({ ...mock, score: mockExamScore(mock) })),
    bySubject: order.map((subject) => ({
      subjectId: subject.id,
      name: subject.name,
      points: mocks.flatMap((mock) => {
        const line = mock.subjects.find((s) => s.subjectId === subject.id);
        return line && line.questions > 0
          ? [{ date: mock.date, score: Math.min(1, line.correct / line.questions) }]
          : [];
      }),
    })),
  };
}

/** Já houve simulado nesta volta? (O chefe só é derrotado uma vez por volta.) */
export function bossDefeated(data: AppData, examId: string, lap: number, date = today()): boolean {
  return data.mockExams.some((m) => m.examId === examId && m.lap === lap && m.date <= date);
}
