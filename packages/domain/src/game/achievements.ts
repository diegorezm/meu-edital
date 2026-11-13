import { today } from "../dates";
import { mockExamScore } from "../mockExams";
import { examProgress } from "../tracking";
import type { AppData } from "../types";
import { weeklyStreak } from "./progress";
import { countedMinutes, reviewsOnTime } from "./xp";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  unlocked: boolean;
};

type Rule = {
  id: string;
  title: string;
  description: string;
  target: number;
  measure: (data: AppData, date: string) => number;
};

const totalQuestions = (data: AppData) =>
  data.sessions.reduce((sum, s) => sum + (s.questions ?? 0), 0);
const bestCoverage = (data: AppData) =>
  Math.max(0, ...data.exams.map((e) => examProgress(data, e.id)));
const bestStreak = (data: AppData, date: string) =>
  Math.max(0, ...data.exams.map((e) => weeklyStreak(data, e.id, date).weeks));
const countedHours = (data: AppData) =>
  Math.floor([...countedMinutes(data.sessions).values()].reduce((a, b) => a + b, 0) / 60);

/** Marcos. Todos derivados: excluir a sessão que destravou um marco o tranca de novo. */
export const ACHIEVEMENTS: Rule[] = [
  {
    id: "primeiro-passo",
    title: "Primeiro passo",
    description: "Registrar a primeira sessão de estudo.",
    target: 1,
    measure: (data) => data.sessions.length,
  },
  {
    id: "primeira-volta",
    title: "Primeira volta",
    description: "Completar uma volta inteira da jornada.",
    target: 1,
    measure: (data) => Math.max(0, ...data.exams.map((e) => e.cycleLaps)),
  },
  {
    id: "cem-questoes",
    title: "Cem questões",
    description: "Resolver 100 questões.",
    target: 100,
    measure: totalQuestions,
  },
  {
    id: "mil-questoes",
    title: "Mil questões",
    description: "Resolver 1.000 questões.",
    target: 1000,
    measure: totalQuestions,
  },
  {
    id: "meio-edital",
    title: "Meio edital",
    description: "Estudar metade dos assuntos de um edital.",
    target: 50,
    measure: bestCoverage,
  },
  {
    id: "edital-completo",
    title: "Edital completo",
    description: "Estudar todos os assuntos de um edital.",
    target: 100,
    measure: bestCoverage,
  },
  {
    id: "revisor-em-dia",
    title: "Revisor em dia",
    description: "Fazer 10 revisões no dia do vencimento.",
    target: 10,
    measure: reviewsOnTime,
  },
  {
    id: "quatro-semanas",
    title: "Quatro semanas na meta",
    description: "Bater a meta semanal quatro semanas seguidas.",
    target: 4,
    measure: bestStreak,
  },
  {
    id: "chefe-derrotado",
    title: "Chefe derrotado",
    description: "Registrar o primeiro simulado.",
    target: 1,
    measure: (data) => data.mockExams.length,
  },
  {
    id: "simulado-80",
    title: "Gabarito de respeito",
    description: "Fazer 80% de acertos em um simulado.",
    target: 80,
    measure: (data) => Math.round(Math.max(0, ...data.mockExams.map((m) => mockExamScore(m))) * 100),
  },
  {
    id: "cem-horas",
    title: "Cem horas",
    description: "Somar 100 horas de estudo.",
    target: 100,
    measure: countedHours,
  },
];

export function achievements(data: AppData, date = today()): Achievement[] {
  return ACHIEVEMENTS.map(({ measure, ...rule }) => {
    const value = measure(data, date);
    return {
      ...rule,
      progress: Math.min(rule.target, value),
      unlocked: value >= rule.target,
    };
  });
}
