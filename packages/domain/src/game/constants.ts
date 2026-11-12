/**
 * Tabela de XP e limites do jogo. Mudar um número aqui recalcula tudo, porque
 * XP, nível, conquistas e contratos são derivados das sessões, nunca
 * guardados. Cada regra tem teste em tests/game.test.ts.
 */
export const XP = {
  /** Por minuto estudado (até os limites de sanidade abaixo). */
  perMinute: 1,
  /** Por questão certa. */
  perCorrect: 2,
  /** Por revisão concluída até o dia do vencimento. */
  reviewOnTime: 20,
  /** Por volta completa na jornada. */
  lap: 200,
  /** Por semana com a meta batida. */
  weekGoal: 300,
} as const;

/** Limites de sanidade: evitam que um erro de digitação vire XP. */
export const LIMITS = {
  /** Uma sessão conta no máximo 6 horas. */
  sessionMinutes: 6 * 60,
  /** Um dia conta no máximo 16 horas. */
  dayMinutes: 16 * 60,
} as const;

/**
 * XP total para chegar ao nível `n`: 50 × n × (n − 1).
 * Nível 2 com 100 XP, 10 com 4.500, 20 com 19.000, 30 com 43.500.
 * Com 20 h por semana (cerca de 2.000 XP), o nível 10 chega em 2 a 3 semanas.
 */
export const LEVEL_STEP = 50;

/** Patentes: nomes de carreira pública a partir de cada nível. */
export const RANKS = [
  { from: 1, name: "Estagiário" },
  { from: 5, name: "Técnico" },
  { from: 10, name: "Analista" },
  { from: 20, name: "Auditor" },
  { from: 30, name: "Procurador" },
  { from: 45, name: "Juiz" },
  { from: 60, name: "Desembargador" },
  { from: 80, name: "Ministro" },
] as const;

/** O chapéu acompanha a patente. */
export const HATS = [
  { from: 1, hat: "capelo" },
  { from: 20, hat: "mago" },
  { from: 45, hat: "coroa" },
] as const;
export type Hat = (typeof HATS)[number]["hat"];

/** Skins do mascote, liberadas por nível. Só aparência. */
export const SKINS = [
  { id: "rosa", name: "Rosa", from: 1 },
  { id: "dourado", name: "Dourado", from: 10 },
  { id: "selvagem", name: "Selvagem", from: 20 },
  { id: "melanoide", name: "Melanoide", from: 30 },
] as const;
export type SkinId = (typeof SKINS)[number]["id"];

/** Contratos do dia. */
export const CONTRACTS = {
  /** Questões pedidas na matéria mais fraca. */
  questions: 10,
  /** Revisões vencidas pedidas por dia, no máximo. */
  reviews: 3,
  /** Questões mínimas para uma matéria entrar na conta da "mais fraca". */
  minQuestionsForAccuracy: 10,
} as const;
