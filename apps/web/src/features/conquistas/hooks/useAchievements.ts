import { achievements, chooseSkin, playerProfile, type SkinId, SKINS } from "@meu-edital/domain";
import { useStore } from "@global/store/useStore";
import { useMemo } from "react";

/** Mural de conquistas e gabinete (skin do mascote e chapéu da patente). */
export function useAchievements() {
  const store = useStore();
  const { data } = store;
  const view = useMemo(() => {
    const list = achievements(data);
    const player = playerProfile(data);
    return {
      unlocked: list.filter((a) => a.unlocked).length,
      total: list.length,
      achievements: list.map((a) => ({
        ...a,
        initial: a.title[0],
        progressText: a.unlocked ? "conquistada" : `${a.progress} de ${a.target}`,
      })),
      rank: player.rank,
      hat: player.hat,
      skin: player.skin,
      skins: SKINS.map((s) => ({ id: s.id, name: s.name, from: s.from, unlocked: player.skins.includes(s.id) })),
    };
  }, [data]);
  return { view, choose: (skin: SkinId) => store.update((d) => chooseSkin(d, skin)) };
}

export type AchievementsScreen = ReturnType<typeof useAchievements>;
