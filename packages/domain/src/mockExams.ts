import { today } from "./dates";
import { uid } from "./ids";
import { subjectsInOrder } from "./topics";
import type { AppData, MockExam } from "./types";

export type MockExamInput = Omit<MockExam, "id">;

/** Registra um simulado (o chefe da volta). Linhas de matéria sem questões são ignoradas. */
export function recordMockExam(data: AppData, input: MockExamInput): AppData {
  const subjects = input.subjects
    .filter((s) => s.questions > 0)
    .map((s) => ({ ...s, correct: Math.max(0, Math.min(s.correct, s.questions)) }));
  if (!subjects.length) return data;
  const entry: MockExam = { ...input, title: input.title.trim() || "Simulado", subjects, id: uid() };
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
        return line ? [{ date: mock.date, score: line.correct / line.questions }] : [];
      }),
    })),
  };
}

/** Já houve simulado nesta volta? (O chefe só é derrotado uma vez por volta.) */
export function bossDefeated(data: AppData, examId: string, lap: number, date = today()): boolean {
  return data.mockExams.some((m) => m.examId === examId && m.lap === lap && m.date <= date);
}
