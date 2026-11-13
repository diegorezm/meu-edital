import { dueReviews, today } from "@meu-edital/domain";
import { createDb, pushSubscriptions } from "@meu-edital/db";
import { loadAppData } from "../data/proposals";
import { sendPush } from "./send";

type ReminderEnv = Pick<Env, "DB" | "VAPID_PRIVATE_KEY" | "APP_URL">;

/**
 * Lembrete diário: quem tem avisos ligados e revisões vencidas no concurso
 * ativo recebe um aviso. Sem culpa e sem insistência: um por dia, no máximo.
 */
export async function sendDueReviewReminders(env: ReminderEnv, date = today()): Promise<number> {
  const db = createDb(env.DB);
  const rows = await db.select({ userId: pushSubscriptions.userId }).from(pushSubscriptions);
  const users = [...new Set(rows.map((r) => r.userId))];
  let notified = 0;
  for (const userId of users) {
    const data = await loadAppData(db, userId);
    if (!data.activeExamId) continue;
    const due = dueReviews(data, data.activeExamId, date).length;
    if (!due) continue;
    const sent = await sendPush(env, userId, {
      title: due === 1 ? "1 revisão para hoje" : `${due} revisões para hoje`,
      body: "Uma revisão rápida segura o que você já estudou.",
      url: "/revisoes",
      tag: "revisoes",
    });
    if (sent) notified += 1;
  }
  return notified;
}
