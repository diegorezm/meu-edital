import { desc, eq } from "drizzle-orm";
import { type Db, trackingConsents } from "@meu-edital/db";
import { uid } from "@meu-edital/domain";
import { currentVersion } from "./documents";

export const TRACKING_CATEGORIES = ["erros", "analise"] as const;
export type TrackingCategory = (typeof TRACKING_CATEGORIES)[number];
export type TrackingChoices = Record<TrackingCategory, boolean>;

/** Escolhas de rastreamento de um usuário. Sempre pelo `userId` da sessão. */
export function trackingData(db: Db, userId: string) {
  return {
    /** A escolha mais recente de cada categoria, ou null se nunca escolheu. */
    async latest(): Promise<{ choices: TrackingChoices; policyVersion: string } | null> {
      const rows = await db
        .select()
        .from(trackingConsents)
        .where(eq(trackingConsents.userId, userId))
        .orderBy(desc(trackingConsents.decidedAt), desc(trackingConsents.id));
      if (rows.length === 0) return null;
      const pick = (category: TrackingCategory) => rows.find((r) => r.category === category);
      return {
        choices: { erros: pick("erros")?.granted ?? true, analise: pick("analise")?.granted ?? false },
        policyVersion: rows[0]!.policyVersion,
      };
    },

    async save(choices: TrackingChoices) {
      const decidedAt = Date.now();
      const policyVersion = currentVersion("privacidade").version;
      await db.insert(trackingConsents).values(
        TRACKING_CATEGORIES.map((category) => ({
          id: uid(),
          userId,
          category,
          granted: choices[category],
          policyVersion,
          decidedAt,
        })),
      );
    },
  };
}
