import { today } from "../dates";
import type { AppData } from "../types";
import { SKINS, type SkinId } from "./constants";
import { type Level, levelInfo, unlockedSkins } from "./levels";
import { playerXp, type XpBreakdown } from "./xp";

export type Player = Level & {
  breakdown: XpBreakdown;
  skin: SkinId;
  skins: SkinId[];
};

/** Ficha do jogador: XP, nível, patente, chapéu e skins. Tudo derivado. */
export function playerProfile(data: AppData, date = today()): Player {
  const breakdown = playerXp(data, date);
  const level = levelInfo(breakdown.total);
  const skins = unlockedSkins(level.level);
  // Uma skin escolhida que deixou de valer (sessões excluídas) volta para a padrão.
  const skin = skins.includes(data.skin) ? data.skin : "rosa";
  return { ...level, breakdown, skin, skins };
}

/** Escolhe a skin do mascote. Só aparência; precisa estar liberada. */
export function chooseSkin(data: AppData, skin: SkinId, date = today()): AppData {
  if (!SKINS.some((s) => s.id === skin)) return data;
  if (!playerProfile(data, date).skins.includes(skin)) return data;
  return data.skin === skin ? data : { ...data, skin };
}
