import { buildPushHTTPRequest } from "@pushforge/builder";
import { and, eq } from "drizzle-orm";
import { createDb, pushSubscriptions } from "@meu-edital/db";

/** O que o service worker do app mostra. */
export type PushMessage = { title: string; body: string; url?: string; tag?: string };

type PushEnv = Pick<Env, "DB" | "VAPID_PRIVATE_KEY" | "APP_URL">;

/**
 * Envia um aviso para todos os navegadores do usuário. Assinaturas que o
 * serviço de push diz não existirem mais (404/410) são apagadas.
 */
export async function sendPush(env: PushEnv, userId: string, message: PushMessage): Promise<number> {
  if (!env.VAPID_PRIVATE_KEY) return 0;
  const db = createDb(env.DB);
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  let sent = 0;
  for (const sub of subs) {
    const { endpoint, headers, body } = await buildPushHTTPRequest({
      privateJWK: env.VAPID_PRIVATE_KEY,
      subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      message: {
        payload: message,
        adminContact: env.APP_URL,
        options: { ttl: 3600, urgency: "normal", ...(message.tag ? { topic: message.tag } : {}) },
      },
    });
    const response = await fetch(endpoint, { method: "POST", headers, body });
    if (response.status === 404 || response.status === 410)
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.endpoint, sub.endpoint), eq(pushSubscriptions.userId, userId)));
    else if (response.ok) sent += 1;
  }
  return sent;
}
