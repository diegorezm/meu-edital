import { describe, expect, it } from "vitest";
import {
  addSubject,
  addTopic,
  elapsedMinutes,
  elapsedMs,
  emptyData,
  formatClock,
  GENERAL_TOPIC,
  moveSubject,
  moveTopic,
  pauseTimer,
  POPULAR_EXAMS,
  recordSession,
  renameTopic,
  resumeTimer,
  sessionsAffected,
  setActiveExam,
  setReviewOffsets,
  shouldNotifyEnd,
  startExam,
  startTimer,
  subjectsInOrder,
  subjectWeight,
  topicsInOrder,
  topicTreeIds,
  updateExam,
  updateSubject,
} from "../src";

const base = () =>
  startExam(emptyData(), {
    name: "TRT",
    hoursPerWeek: 10,
    subjects: [{ name: "Português", topics: ["Crase", "Concordância"] }, { name: "Informática" }],
  });

describe("edição do edital", () => {
  it("edita o concurso e troca o ativo", () => {
    const data = base();
    const examId = data.activeExamId!;
    expect(updateExam(data, examId, { hoursPerWeek: 20, board: "FCC" }).exams[0]).toMatchObject({
      hoursPerWeek: 20,
      board: "FCC",
    });
    const two = startExam(data, { name: "INSS", hoursPerWeek: 5, subjects: [{ name: "Ética" }] });
    expect(setActiveExam(two, examId).activeExamId).toBe(examId);
    expect(setActiveExam(two, "inexistente")).toBe(two);
  });

  it("acrescenta matéria no fim, já com um assunto para estudar", () => {
    const start = base();
    const examId = start.activeExamId!;
    const data = addSubject(start, examId, "  Direito  ");
    const subjects = subjectsInOrder(data, examId);
    expect(subjects.at(-1)?.name).toBe("Direito");
    expect(topicsInOrder(data, subjects.at(-1)!.id).map((t) => t.name)).toEqual([GENERAL_TOPIC]);
    expect(addSubject(data, examId, "   ")).toBe(data);
  });

  it("peso direto e questões × pontos se substituem", () => {
    const data = base();
    const id = data.subjects[0].id;
    const byQuestions = updateSubject(data, id, { questions: 10, pointsPerQuestion: 2 });
    expect(subjectWeight(byQuestions.subjects[0])).toBe(20);
    const byWeight = updateSubject(byQuestions, id, { weight: 3 });
    expect(byWeight.subjects[0]).toMatchObject({ weight: 3, questions: undefined, pointsPerQuestion: undefined });
  });

  it("acrescenta, renomeia e reordena assuntos e subassuntos", () => {
    let data = base();
    const subjectId = data.subjects[0].id;
    const [crase] = topicsInOrder(data, subjectId);
    data = addTopic(data, subjectId, "Uso facultativo", crase.id);
    data = renameTopic(data, crase.id, "Crase e acento");
    data = addTopic(data, subjectId, "Pontuação");
    expect(topicsInOrder(data, subjectId).map((t) => t.name)).toEqual([
      "Crase e acento",
      "Uso facultativo",
      "Concordância",
      "Pontuação",
    ]);
    const pontuacao = topicsInOrder(data, subjectId).at(-1)!;
    data = moveTopic(data, pontuacao.id, -1);
    expect(topicsInOrder(data, subjectId).map((t) => t.name).slice(2)).toEqual(["Pontuação", "Concordância"]);
    expect(moveTopic(data, crase.id, -1)).toBe(data);
    expect(topicTreeIds(data, crase.id)).toHaveLength(2);
  });

  it("reordena matérias", () => {
    const data = base();
    const examId = data.activeExamId!;
    const moved = moveSubject(data, data.subjects[1].id, -1);
    expect(subjectsInOrder(moved, examId).map((s) => s.name)).toEqual(["Informática", "Português"]);
  });

  it("intervalos de revisão ficam limpos e crescentes", () => {
    expect(setReviewOffsets(emptyData(), [30, 7, 7, 0, 1]).reviewOffsets).toEqual([1, 7, 30]);
    const data = emptyData();
    expect(setReviewOffsets(data, [0, -2])).toBe(data);
  });

  it("conta as sessões que uma exclusão leva junto", () => {
    const data = base();
    const topic = data.topics[0];
    const studied = recordSession(data, {
      examId: data.activeExamId!,
      subjectId: topic.subjectId,
      topicId: topic.id,
      type: "Teoria",
      minutes: 20,
    });
    expect(sessionsAffected(studied, { subjectId: topic.subjectId })).toBe(1);
    expect(sessionsAffected(studied, { topicIds: [data.topics[1].id] })).toBe(0);
  });

  it("os concursos populares têm matérias com assuntos", () => {
    for (const exam of POPULAR_EXAMS) {
      expect(exam.subjects.length).toBeGreaterThan(3);
      for (const subject of exam.subjects) expect(subject.topics?.length).toBeGreaterThan(0);
    }
  });
});

describe("cronômetro", () => {
  const setup = { examId: "e", subjectId: "s", topicId: "t", type: "Teoria" as const, plannedMinutes: 30 };

  it("sobrevive a pausa e retomada, guardando instantes e não contadores", () => {
    let timer = startTimer(setup, 0);
    expect(elapsedMs(timer, 10 * 60_000)).toBe(10 * 60_000);
    timer = pauseTimer(timer, 10 * 60_000);
    expect(elapsedMs(timer, 99 * 60_000)).toBe(10 * 60_000);
    timer = resumeTimer(timer, 100 * 60_000);
    expect(elapsedMinutes(timer, 105 * 60_000 + 40_000)).toBe(16);
  });

  it("avisa o fim do bloco uma vez", () => {
    const timer = startTimer(setup, 0);
    expect(shouldNotifyEnd(timer, 29 * 60_000)).toBe(false);
    expect(shouldNotifyEnd(timer, 30 * 60_000)).toBe(true);
    expect(shouldNotifyEnd({ ...timer, notified: true }, 31 * 60_000)).toBe(false);
  });

  it("formata como relógio", () => {
    expect(formatClock(38 * 60_000 + 12_000)).toBe("38:12");
    expect(formatClock(3_909_000)).toBe("1:05:09");
    expect(elapsedMinutes(startTimer(setup, 0), 5_000)).toBe(1);
  });
});

describe("catálogo de editais", () => {
  it("cada concurso tem matérias com questões e assuntos, e começa com pesos", async () => {
    const { EXAM_CATALOG } = await import("../src");
    expect(EXAM_CATALOG.length).toBeGreaterThanOrEqual(12);
    expect(new Set(EXAM_CATALOG.map((e) => e.id)).size).toBe(EXAM_CATALOG.length);
    for (const exam of EXAM_CATALOG)
      for (const subject of exam.subjects) {
        expect(subject.questions).toBeGreaterThan(0);
        expect(subject.topics?.length).toBeGreaterThan(0);
      }
    const inss = EXAM_CATALOG.find((e) => e.id === "inss-tecnico")!;
    const data = startExam(emptyData(), { ...inss, hoursPerWeek: 20 });
    expect(data.exams[0].board).toBe("Cebraspe");
    expect(subjectWeight(data.subjects.find((s) => s.name === "Direito Previdenciário")!)).toBe(30);
  });

  it("topicTreeIds termina mesmo se houver ciclo em parentId e CSV neutraliza fórmulas", async () => {
    const { recordSession, sessionsCsv, topicTreeIds } = await import("../src");
    const base = startExam(emptyData(), {
      name: "=HYPERLINK(\"http://evil\")",
      hoursPerWeek: 10,
      subjects: [{ name: "+SUM(A1:A2)", topics: ["Crase"] }],
    });
    const subjectId = base.subjects[0].id;
    const cyclic = {
      ...base,
      topics: [
        { id: "a", subjectId, parentId: "b", name: "A", position: 0 },
        { id: "b", subjectId, parentId: "a", name: "B", position: 1 },
      ],
    };
    expect(topicTreeIds(cyclic, "a").sort()).toEqual(["a", "b"]);

    const withSession = recordSession(
      base,
      {
        examId: base.activeExamId!,
        subjectId,
        topicId: base.topics[0].id,
        type: "Teoria",
        minutes: 30,
        note: "=CMD()",
      },
      "2026-11-12",
    );
    const csv = sessionsCsv(withSession);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+SUM(A1:A2)");
    expect(csv).toContain("'=CMD()");
  });

  it("removeCycleItem normaliza cyclePosition e updateSession não desloca revisão já concluída", async () => {
    const { addDays, cycleState, recordSession, removeCycleItem, updateSession } = await import("../src");
    let data = startExam(emptyData(), {
      name: "TRT",
      hoursPerWeek: 2,
      subjects: [
        { name: "Português", topics: ["Crase"] },
        { name: "Direito", topics: ["Princípios"] },
      ],
    });
    const examId = data.activeExamId!;
    const lastBlock = cycleState(data, examId).items.at(-1)!;
    data = { ...data, exams: data.exams.map((e) => ({ ...e, cyclePosition: cycleState(data, examId).items.length - 1 })) };
    const afterRemove = removeCycleItem(data, examId, lastBlock.id);
    expect(afterRemove.exams[0].cyclePosition).toBeLessThan(cycleState(afterRemove, examId).items.length);

    const topic = data.topics[0];
    const studied = recordSession(
      data,
      { examId, subjectId: topic.subjectId, topicId: topic.id, type: "Teoria", minutes: 30 },
      "2026-11-10",
    );
    const firstSessionId = studied.sessions[0].id;
    const reviewed = recordSession(
      studied,
      { examId, subjectId: topic.subjectId, topicId: topic.id, type: "Revisão", minutes: 15 },
      addDays("2026-11-10", 1),
    );
    const doneBefore = reviewed.reviews.find((r) => r.completedBySessionId)!;
    const pendingBefore = reviewed.reviews.find((r) => !r.completedBySessionId)!;
    const shifted = updateSession(reviewed, firstSessionId, { date: "2026-11-08" });
    expect(shifted.reviews.find((r) => r.id === doneBefore.id)?.dueDate).toBe(doneBefore.dueDate);
    expect(shifted.reviews.find((r) => r.id === pendingBefore.id)?.dueDate).toBe(addDays(pendingBefore.dueDate, -2));
  });

  it("removeSubject normaliza cyclePosition, recordMockExam deduplica matérias e inFinalStretch valida janela", async () => {
    const { cycleState, inFinalStretch, recordMockExam, removeSubject } = await import("../src");
    let data = startExam(emptyData(), {
      name: "INSS",
      hoursPerWeek: 4,
      subjects: [
        { name: "Português", topics: ["Crase"] },
        { name: "Previdenciário", topics: ["Segurados"] },
      ],
    });
    const examId = data.activeExamId!;
    data = { ...data, exams: data.exams.map((e) => ({ ...e, cyclePosition: 3 })) };
    const afterSub = removeSubject(data, data.subjects[1].id);
    expect(afterSub.exams[0].cyclePosition).toBeLessThan(cycleState(afterSub, examId).items.length);

    const ptId = afterSub.subjects[0].id;
    const mocked = recordMockExam(afterSub, {
      examId,
      date: "2026-11-12",
      title: "  Simulado 1  ",
      lap: 1,
      subjects: [
        { subjectId: ptId, questions: 10, correct: 7 },
        { subjectId: ptId, questions: 5, correct: 4 },
      ],
    });
    expect(mocked.mockExams[0].subjects).toEqual([{ subjectId: ptId, questions: 15, correct: 11 }]);
    expect(inFinalStretch("2026-11-20", "2026-11-10")).toBe(true);
    expect(inFinalStretch("2026-12-30", "2026-11-10")).toBe(false);
    expect(inFinalStretch("2026-11-01", "2026-11-10")).toBe(false);
  });
});
