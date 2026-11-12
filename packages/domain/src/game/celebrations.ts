import { today, weekStartOf } from "../dates";
import type { AppData } from "../types";
import { achievements } from "./achievements";
import { levelInfo } from "./levels";
import { weeklyStreak } from "./progress";
import { playerXp } from "./xp";

export type Celebration =
  | { id: string; kind: "level"; level: number; rank: string; rankChanged: boolean }
  | { id: string; kind: "lap"; examId: string; laps: number }
  | { id: string; kind: "achievement"; achievementId: string; title: string }
  | { id: string; kind: "weekGoal"; examId: string; weekStart: string };

/**
 * Comemorações que aparecem ao passar de `before` para `after` (por exemplo,
 * ao registrar uma sessão): subir de nível, fechar a volta, destravar uma
 * conquista e bater a meta da semana. Os ids são estáveis, para o app não
 * comemorar duas vezes a mesma coisa (`seenCelebrations`).
 */
export function celebrationsBetween(before: AppData, after: AppData, date = today()): Celebration[] {
  const events: Celebration[] = [];
  const was = levelInfo(playerXp(before, date).total);
  const now = levelInfo(playerXp(after, date).total);
  if (now.level > was.level)
    events.push({
      id: `level:${now.level}`,
      kind: "level",
      level: now.level,
      rank: now.rank,
      rankChanged: now.rank !== was.rank,
    });

  for (const exam of after.exams) {
    const previous = before.exams.find((e) => e.id === exam.id);
    if (previous && exam.cycleLaps > previous.cycleLaps)
      events.push({ id: `lap:${exam.id}:${exam.cycleLaps}`, kind: "lap", examId: exam.id, laps: exam.cycleLaps });
    if (
      previous &&
      weeklyStreak(after, exam.id, date).currentWeekMet &&
      !weeklyStreak(before, exam.id, date).currentWeekMet
    ) {
      const weekStart = weekStartOf(date);
      events.push({ id: `week:${exam.id}:${weekStart}`, kind: "weekGoal", examId: exam.id, weekStart });
    }
  }

  const unlockedBefore = new Set(achievements(before, date).filter((a) => a.unlocked).map((a) => a.id));
  for (const achievement of achievements(after, date))
    if (achievement.unlocked && !unlockedBefore.has(achievement.id))
      events.push({
        id: `achievement:${achievement.id}`,
        kind: "achievement",
        achievementId: achievement.id,
        title: achievement.title,
      });

  const seen = new Set(after.seenCelebrations);
  return events.filter((event) => !seen.has(event.id));
}

/** Guarda que o estudante já viu estas comemorações (sincroniza entre aparelhos). */
export function markCelebrationsSeen(data: AppData, ids: string[]): AppData {
  const fresh = ids.filter((id) => !data.seenCelebrations.includes(id));
  if (!fresh.length) return data;
  // Guarda só as mais recentes: ids antigos não voltam a acontecer.
  return { ...data, seenCelebrations: [...data.seenCelebrations, ...fresh].slice(-200) };
}
