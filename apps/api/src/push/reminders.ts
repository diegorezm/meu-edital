import { and, count, eq, isNull, lte } from "drizzle-orm";
import { today } from "@meu-edital/domain";
import { createDb, pushSubscriptions, reviews, userSettings } from "@meu-edital/db";
import { sendPush } from "./send";

type ReminderEnv = Pick<Env, "DB" | "VAPID_PRIVATE_KEY" | "APP_URL">;

const CONCURRENCY = 5;

/**
 * Lembrete diário: quem tem avisos ligados e revisões vencidas no concurso
 * ativo recebe um aviso. Sem culpa e sem insistência: um por dia, no máximo.
 *
 * Usa uma única consulta agregada no D1 (sem carregar o restante dos dados
 * de cada estudante) e despacha os envios com concorrência limitada.
 */
export async function sendDueReviewReminders(env: ReminderEnv, date = today()): Promise<number> {
  const db = createDb(env.DB);
  const pending = await db
    .select({
      userId: reviews.userId,
      due: count(reviews.id),
    })
    .from(reviews)
    .innerJoin(
      userSettings,
      and(
        eq(userSettings.userId, reviews.userId),
        eq(userSettings.activeExamId, reviews.examId),
        isNull(userSettings.deletedAt),
      ),
    )
    .where(
      and(
        isNull(reviews.deletedAt),
        isNull(reviews.completedBySessionId),
        lte(reviews.dueDate, date),
      ),
    )
    .groupBy(reviews.userId);

  if (!pending.length) return 0;

  const subscribedRows = await db
    .selectDistinct({ userId: pushSubscriptions.userId })
    .from(pushSubscriptions);
  const subscribed = new Set(subscribedRows.map((r) => r.userId));
  const targets = pending.filter((row) => row.due > 0 && subscribed.has(row.userId));

  let notified = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const slice = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      slice.map(async ({ userId, due }) => {
        try {
          const sent = await sendPush(env, userId, {
            title: due === 1 ? "1 revisão para hoje" : `${due} revisões para hoje`,
            body: "Uma revisão rápida segura o que você já estudou.",
            url: "/revisoes",
            tag: "revisoes",
          });
          return sent > 0 ? 1 : 0;
        } catch (error) {
          console.error("Falha ao enviar lembrete de revisões", { userId, error });
          return 0;
        }
      }),
    );
    for (const n of results) notified += n;
  }
  return notified;
}
