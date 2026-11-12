import { describe, expect, it } from "vitest";
import {
  achievements,
  addDays,
  type AppData,
  celebrationsBetween,
  chooseSkin,
  cycleState,
  dailyContracts,
  deleteSession,
  emptyData,
  levelForXp,
  levelInfo,
  markCelebrationsSeen,
  playerProfile,
  playerXp,
  recordSession,
  type SessionInput,
  sessionXp,
  startExam,
  subjectLevels,
  topicsInOrder,
  weeklyStreak,
  XP,
  xpForLevel,
} from "../src";

// Quinta-feira; a semana começa na segunda 2026-11-09.
const DAY = "2026-11-12";

function setup(hoursPerWeek = 10) {
  const data = startExam(emptyData(), {
    name: "TRT",
    hoursPerWeek,
    subjects: [
      { name: "Português", topics: ["Crase", "Concordância"] },
      { name: "Informática", topics: ["Redes"] },
      { name: "Direito", topics: ["Atos"] },
    ],
  });
  return { data, examId: data.activeExamId! };
}

function study(
  data: AppData,
  examId: string,
  date: string,
  extra: Partial<SessionInput> & { subjectIndex?: number; topicIndex?: number } = {},
) {
  const { subjectIndex = 0, topicIndex = 0, ...rest } = extra;
  const subject = data.subjects.filter((s) => s.examId === examId)[subjectIndex];
  const topic = topicsInOrder(data, subject.id)[topicIndex];
  return recordSession(
    data,
    { examId, subjectId: subject.id, topicId: topic.id, type: "Teoria", minutes: 30, ...rest },
    date,
  );
}

function studyBlock(data: AppData, examId: string, date: string) {
  const block = cycleState(data, examId).next!;
  const topic = topicsInOrder(data, block.subjectId)[0];
  return recordSession(
    data,
    { examId, subjectId: block.subjectId, topicId: topic.id, cycleItemId: block.id, type: "Teoria", minutes: block.minutes },
    date,
  );
}

describe("tabela de XP", () => {
  it("dá 1 XP por minuto e 2 por questão certa", () => {
    const { data, examId } = setup();
    const next = study(data, examId, DAY, { type: "Questões", minutes: 45, questions: 10, correct: 8 });
    expect(playerXp(next, DAY)).toMatchObject({ minutes: 45, correct: 16, total: 61 });
    expect(sessionXp({ minutes: 45, correct: 8 })).toBe(61);
  });

  it("conta no máximo 6 h por sessão e 16 h por dia", () => {
    const { data, examId } = setup(112);
    const long = study(data, examId, DAY, { minutes: 500 });
    expect(playerXp(long, DAY).minutes).toBe(360);
    let day = data;
    for (let i = 0; i < 4; i += 1) day = study(day, examId, DAY, { minutes: 360, topicIndex: i % 2 });
    expect(playerXp(day, DAY).minutes).toBe(16 * 60);
  });

  it("dá +20 por revisão feita no dia do vencimento, e nada se atrasar", () => {
    const { data, examId } = setup();
    const studied = study(data, examId, DAY);
    const due = addDays(DAY, 1);
    const onTime = study(studied, examId, due, { type: "Revisão", minutes: 15 });
    expect(playerXp(onTime, due).reviews).toBe(XP.reviewOnTime);
    const late = study(studied, examId, addDays(DAY, 2), { type: "Revisão", minutes: 15 });
    expect(playerXp(late, addDays(DAY, 2)).reviews).toBe(0);
  });

  it("dá +200 por volta completa e +300 por semana com a meta batida", () => {
    const { data, examId } = setup(1);
    let next = data;
    const blocks = cycleState(data, examId).items.length;
    for (let i = 0; i < blocks; i += 1) next = studyBlock(next, examId, DAY);
    const xp = playerXp(next, DAY);
    expect(xp.laps).toBe(XP.lap);
    expect(xp.weeks).toBe(XP.weekGoal);
  });

  it("excluir uma sessão corrige o XP sozinho", () => {
    const { data, examId } = setup();
    const next = study(data, examId, DAY, { minutes: 40 });
    expect(playerXp(next, DAY).total).toBe(40);
    expect(playerXp(deleteSession(next, next.sessions[0].id), DAY).total).toBe(0);
  });
});

describe("nível, patente e cosméticos", () => {
  it("segue a curva 50 × n × (n − 1)", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(4499)).toBe(9);
    expect(levelForXp(4500)).toBe(10);
    expect(levelInfo(150)).toMatchObject({ level: 2, levelStart: 100, nextLevelAt: 300, progress: 0.25 });
  });

  it("troca patente e chapéu por faixa de nível", () => {
    expect(levelInfo(0)).toMatchObject({ rank: "Estagiário", hat: "capelo" });
    expect(levelInfo(xpForLevel(10))).toMatchObject({ rank: "Analista", hat: "capelo" });
    expect(levelInfo(xpForLevel(20))).toMatchObject({ rank: "Auditor", hat: "mago" });
    expect(levelInfo(xpForLevel(45))).toMatchObject({ rank: "Juiz", hat: "coroa" });
  });

  it("só deixa escolher skin liberada", () => {
    const { data } = setup();
    expect(chooseSkin(data, "dourado", DAY).skin).toBe("rosa");
    const veteran = { ...data, exams: data.exams.map((e) => ({ ...e, cycleLaps: 30 })) };
    expect(playerProfile(veteran, DAY).skins).toContain("dourado");
    expect(chooseSkin(veteran, "dourado", DAY).skin).toBe("dourado");
    expect(playerProfile({ ...data, skin: "melanoide" }, DAY).skin).toBe("rosa");
  });
});

describe("ofensiva semanal", () => {
  it("conta semanas seguidas na meta e não quebra com a semana em andamento", () => {
    const { data, examId } = setup(1);
    let next = data;
    for (const weeksAgo of [3, 2, 1]) next = study(next, examId, addDays(DAY, -7 * weeksAgo), { minutes: 60 });
    expect(weeklyStreak(next, examId, DAY)).toEqual({ weeks: 3, currentWeekMet: false });
    next = study(next, examId, DAY, { minutes: 60 });
    expect(weeklyStreak(next, examId, DAY)).toEqual({ weeks: 4, currentWeekMet: true });
  });

  it("uma semana perdida zera a sequência", () => {
    const { data, examId } = setup(1);
    let next = study(data, examId, addDays(DAY, -21), { minutes: 60 });
    next = study(next, examId, addDays(DAY, -7), { minutes: 60 });
    expect(weeklyStreak(next, examId, DAY).weeks).toBe(1);
  });
});

describe("contratos do dia", () => {
  it("gera três contratos e cumpre o do bloco com estudo", () => {
    const { data, examId } = setup();
    const contracts = dailyContracts(data, examId, DAY);
    expect(contracts.map((c) => c.kind)).toEqual(["block", "newTopic", "questions"]);
    expect(contracts.every((c) => !c.done)).toBe(true);
    const done = dailyContracts(studyBlock(data, examId, DAY), examId, DAY);
    expect(done.find((c) => c.kind === "block")?.done).toBe(true);
    expect(done.find((c) => c.kind === "newTopic")?.done).toBe(true);
  });

  it("pede as revisões que já estavam vencidas e conta as feitas no dia", () => {
    const { data, examId } = setup();
    const studied = study(data, examId, addDays(DAY, -1));
    const morning = dailyContracts(studied, examId, DAY).find((c) => c.kind === "reviews")!;
    expect(morning).toMatchObject({ target: 1, progress: 0, done: false });
    const reviewed = study(studied, examId, DAY, { type: "Revisão", minutes: 15 });
    const evening = dailyContracts(reviewed, examId, DAY).find((c) => c.kind === "reviews")!;
    expect(evening).toMatchObject({ target: 1, progress: 1, done: true, title: morning.title });
  });

  it("escolhe a matéria de pior aproveitamento para as questões", () => {
    const { data, examId } = setup();
    let next = study(data, examId, addDays(DAY, -2), { type: "Questões", questions: 20, correct: 18 });
    next = study(next, examId, addDays(DAY, -2), { subjectIndex: 1, type: "Questões", questions: 20, correct: 5 });
    const contract = dailyContracts(next, examId, DAY).find((c) => c.kind === "questions")!;
    expect(contract.title).toBe("10 questões de Informática");
    const after = study(next, examId, DAY, { subjectIndex: 1, type: "Questões", questions: 12, correct: 6 });
    expect(dailyContracts(after, examId, DAY).find((c) => c.kind === "questions")?.done).toBe(true);
  });

  it("clicar não cumpre contrato: sem estudo no dia, nada muda", () => {
    const { data, examId } = setup();
    const earlier = study(data, examId, addDays(DAY, -1));
    expect(dailyContracts(earlier, examId, DAY).every((c) => c.progress === 0)).toBe(true);
  });
});

describe("estrelas da matéria", () => {
  it("sobem com cobertura e acertos", () => {
    const { data, examId } = setup();
    expect(subjectLevels(data, examId, DAY)[0].stars).toBe(1);
    let next = study(data, examId, DAY, { type: "Questões", questions: 10, correct: 10 });
    next = study(next, examId, DAY, { topicIndex: 1, type: "Questões", questions: 10, correct: 10 });
    expect(subjectLevels(next, examId, DAY)[0]).toMatchObject({ stars: 5, coverage: 1, accuracy: 1 });
  });
});

describe("conquistas e comemorações", () => {
  it("destrava conquistas pelo estudo e tranca de novo se a sessão sumir", () => {
    const { data, examId } = setup();
    const next = study(data, examId, DAY, { type: "Questões", questions: 40, correct: 30 });
    const list = achievements(next, DAY);
    expect(list.find((a) => a.id === "primeiro-passo")?.unlocked).toBe(true);
    expect(list.find((a) => a.id === "cem-questoes")).toMatchObject({ progress: 40, unlocked: false });
    const undone = deleteSession(next, next.sessions[0].id);
    expect(achievements(undone, DAY).find((a) => a.id === "primeiro-passo")?.unlocked).toBe(false);
  });

  it("comemora nível, volta, meta e conquista ao registrar, uma vez só", () => {
    const { data, examId } = setup(1);
    let before = data;
    const blocks = cycleState(data, examId).items.length;
    for (let i = 0; i < blocks - 1; i += 1) before = studyBlock(before, examId, DAY);
    const after = studyBlock(before, examId, DAY);
    const events = celebrationsBetween(before, after, DAY);
    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain("lap");
    expect(kinds).toContain("level");
    expect(events.find((e) => e.kind === "achievement" && e.achievementId === "primeira-volta")).toBeTruthy();

    const seen = markCelebrationsSeen(after, events.map((e) => e.id));
    expect(celebrationsBetween(before, seen, DAY)).toEqual([]);
  });

  it("primeira sessão comemora a conquista Primeiro passo", () => {
    const { data, examId } = setup();
    const events = celebrationsBetween(data, study(data, examId, DAY), DAY);
    expect(events.map((e) => e.id)).toContain("achievement:primeiro-passo");
  });
});
