import { describe, expect, it } from "vitest";
import {
  achievements,
  addDays,
  type AppData,
  deleteMockExam,
  deleteSession,
  emptyData,
  exportJson,
  FINAL_STRETCH,
  inFinalStretch,
  mockExamHistory,
  mockExamScore,
  performanceBySubject,
  recordMockExam,
  recordSession,
  removeExam,
  sessionsCsv,
  startExam,
  topicsInOrder,
  weeklyAllocation,
} from "../src";

const DAY = "2026-11-12";

function setup() {
  const data = startExam(emptyData(), {
    name: "TRT",
    hoursPerWeek: 10,
    subjects: [{ name: "Português", topics: ["Crase", "Concordância"] }, { name: "Informática", topics: ["Redes"] }],
  });
  return { data, examId: data.activeExamId! };
}

const studyTopic = (data: AppData, examId: string, date: string, extra: Partial<Parameters<typeof recordSession>[1]> = {}) => {
  const subject = data.subjects[0];
  const topic = topicsInOrder(data, subject.id)[0];
  return recordSession(
    data,
    { examId, subjectId: subject.id, topicId: topic.id, type: "Teoria", minutes: 30, ...extra },
    date,
  );
};

describe("simulados", () => {
  it("registra, calcula a nota e mostra a evolução por matéria", () => {
    const { data, examId } = setup();
    const [pt, info] = data.subjects;
    let next = recordMockExam(data, {
      examId,
      date: "2026-11-01",
      title: "Simulado 1",
      lap: 1,
      subjects: [
        { subjectId: pt.id, questions: 10, correct: 6 },
        { subjectId: info.id, questions: 10, correct: 12 },
        { subjectId: "vazia", questions: 0, correct: 0 },
      ],
    });
    next = recordMockExam(next, {
      examId,
      date: "2026-11-10",
      title: "",
      lap: 2,
      subjects: [{ subjectId: pt.id, questions: 10, correct: 9 }],
    });
    const history = mockExamHistory(next, examId);
    expect(history.mocks.map((m) => m.title)).toEqual(["Simulado 1", "Simulado"]);
    expect(mockExamScore(history.mocks[0])).toBe(0.8);
    expect(history.bySubject[0].points.map((p) => p.score)).toEqual([0.6, 0.9]);
    expect(achievements(next, DAY).find((a) => a.id === "simulado-80")?.unlocked).toBe(true);
    expect(deleteMockExam(next, history.mocks[0].id).mockExams).toHaveLength(1);
    expect(removeExam(next, examId).mockExams).toEqual([]);
  });

  it("simulado sem questões não é registrado", () => {
    const { data, examId } = setup();
    expect(recordMockExam(data, { examId, date: DAY, title: "x", lap: 1, subjects: [] })).toBe(data);
  });
});

describe("revisão adaptativa", () => {
  it("aproveitamento baixo traz a próxima revisão para antes, e excluir a sessão desfaz", () => {
    const { data, examId } = setup();
    const studied = studyTopic(data, examId, DAY);
    const dueDates = studied.reviews.map((r) => r.dueDate);
    expect(dueDates).toEqual([addDays(DAY, 1), addDays(DAY, 7), addDays(DAY, 30)]);
    const reviewDay = addDays(DAY, 1);
    const weak = studyTopic(studied, examId, reviewDay, { type: "Revisão", questions: 10, correct: 4 });
    // Próxima revisão estava 6 dias depois; com 40% vem na metade (3 dias).
    expect(weak.reviews.map((r) => r.dueDate)).toEqual([addDays(DAY, 1), addDays(reviewDay, 3), addDays(DAY, 27)]);
    const undone = deleteSession(weak, weak.sessions[0].id);
    expect(undone.reviews.map((r) => r.dueDate)).toEqual(dueDates);
  });

  it("aproveitamento alto adia; médio não mexe", () => {
    const { data, examId } = setup();
    const studied = studyTopic(data, examId, DAY);
    const reviewDay = addDays(DAY, 1);
    const strong = studyTopic(studied, examId, reviewDay, { type: "Revisão", questions: 10, correct: 9 });
    expect(strong.reviews[1].dueDate).toBe(addDays(reviewDay, 9));
    const average = studyTopic(studied, examId, reviewDay, { type: "Revisão", questions: 10, correct: 7 });
    expect(average.reviews[1].dueDate).toBe(addDays(DAY, 7));
  });
});

describe("reta final", () => {
  it("nos últimos 30 dias, revisões vencidas ganham mais tempo sem mudar o total", () => {
    const { data, examId } = setup();
    const studied = studyTopic(data, examId, addDays(DAY, -10));
    const withDate = (examDate: string): AppData => ({
      ...studied,
      exams: studied.exams.map((e) => ({ ...e, examDate })),
    });
    expect(inFinalStretch(addDays(DAY, FINAL_STRETCH.days), DAY)).toBe(true);
    expect(inFinalStretch(addDays(DAY, FINAL_STRETCH.days + 1), DAY)).toBe(false);
    expect(inFinalStretch(addDays(DAY, -1), DAY)).toBe(false);
    const far = weeklyAllocation(withDate(addDays(DAY, 90)), examId, DAY);
    const near = weeklyAllocation(withDate(addDays(DAY, 10)), examId, DAY);
    const sum = (list: typeof far) => list.reduce((s, a) => s + a.minutes, 0);
    expect(sum(near)).toBe(sum(far));
    expect(near[0].reviewMinutes).toBeGreaterThan(far[0].reviewMinutes);
  });
});

describe("desempenho e exportação", () => {
  it("soma tempo, questões e aproveitamento por matéria e assunto", () => {
    const { data, examId } = setup();
    let next = studyTopic(data, examId, "2026-11-01", { type: "Questões", minutes: 40, questions: 20, correct: 15 });
    next = studyTopic(next, examId, "2026-11-05", { minutes: 20 });
    const [pt, info] = performanceBySubject(next, examId);
    expect(pt).toMatchObject({ minutes: 60, sessions: 2, questions: 20, accuracy: 0.75, lastStudied: "2026-11-05" });
    expect(pt.topics[0]).toMatchObject({ name: "Crase", sessions: 2 });
    expect(info).toMatchObject({ minutes: 0, accuracy: null });
  });

  it("exporta sessões em CSV com aspas quando precisa e tudo em JSON", () => {
    const { data, examId } = setup();
    const next = studyTopic(data, examId, DAY, { note: 'Rever "crase"; urgente' });
    const csv = sessionsCsv(next);
    const [header, row] = csv.trim().split("\r\n");
    expect(header).toBe("data;concurso;materia;assunto;tipo;minutos;questoes;acertos;anotacao");
    expect(row).toBe(`${DAY};TRT;Português;Crase;Teoria;30;;;"Rever ""crase""; urgente"`);
    const json = exportJson(next);
    expect(json.concursos[0].sessoes).toHaveLength(1);
    expect(json.concursos[0].materias.map((m) => m.name)).toEqual(["Português", "Informática"]);
  });
});
