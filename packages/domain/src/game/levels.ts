import { HATS, type Hat, LEVEL_STEP, RANKS, SKINS, type SkinId } from "./constants";

/** XP total necessário para chegar ao nível `level`. */
export const xpForLevel = (level: number) => LEVEL_STEP * level * (level - 1);

export function levelForXp(xp: number): number {
  // Inverso de 50·n·(n−1) = xp, arredondado para baixo, com conferência.
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * Math.max(0, xp)) / LEVEL_STEP)) / 2));
  while (xpForLevel(level + 1) <= xp) level += 1;
  while (level > 1 && xpForLevel(level) > xp) level -= 1;
  return level;
}

const lastFrom = <T extends { from: number }>(list: readonly T[], level: number): T =>
  [...list].reverse().find((item) => level >= item.from) ?? list[0];

export const rankFor = (level: number): string => lastFrom(RANKS, level).name;
export const hatFor = (level: number): Hat => lastFrom(HATS, level).hat;
export const unlockedSkins = (level: number): SkinId[] =>
  SKINS.filter((skin) => level >= skin.from).map((skin) => skin.id);

export type Level = {
  level: number;
  rank: string;
  hat: Hat;
  xp: number;
  /** XP no começo do nível atual e para o próximo. */
  levelStart: number;
  nextLevelAt: number;
  /** Fração do nível atual já percorrida, de 0 a 1. */
  progress: number;
};

export function levelInfo(xp: number): Level {
  const level = levelForXp(xp);
  const levelStart = xpForLevel(level);
  const nextLevelAt = xpForLevel(level + 1);
  return {
    level,
    rank: rankFor(level),
    hat: hatFor(level),
    xp,
    levelStart,
    nextLevelAt,
    progress: (xp - levelStart) / (nextLevelAt - levelStart),
  };
}
