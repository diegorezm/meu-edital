import { Hono } from "hono";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { createDb, pushSubscriptions } from "@meu-edital/db";
import type { AppContext } from "../env";
import { rateLimit } from "../http/rateLimit";
import { requireUser } from "../http/session";
import { requireConsent } from "../legal/routes";
import { jsonBody } from "../http/validate";

const MAX_SUBSCRIPTIONS = 10;
const B64URL = /^[A-Za-z0-9_-]+$/;

const httpsUrl = z
  .url()
  .max(1000)
  .refine((value) => new URL(value).protocol === "https:", "O endereço de aviso precisa usar HTTPS.");

const SubscriptionSchema = z.object({
  endpoint: httpsUrl,
  keys: z.object({
    p256dh: z.string().min(16).max(200).regex(B64URL),
    auth: z.string().min(8).max(100).regex(B64URL),
  }),
});

/** Assinaturas de Web Push e o aviso de fim de bloco com a aba fechada. */
export const pushRoutes = new Hono<AppContext>()
  .use(requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")), requireConsent)
  .post("/assinatura", jsonBody(SubscriptionSchema, "Assinatura inválida."), async (c) => {
    const parsed = c.req.valid("json");
    const { endpoint, keys } = parsed;
    const userId = c.get("userId");
    const db = createDb(c.env.DB);
    const [existing] = await db
      .select({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    if (existing && existing.userId !== userId)
      return c.json({ error: "Esse navegador já está vinculado a outra conta." }, 409);
    if (!existing) {
      const [total] = await db
        .select({ n: count() })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
      if ((total?.n ?? 0) >= MAX_SUBSCRIPTIONS)
        return c.json({ error: "Limite de aparelhos com avisos atingido." }, 400);
    }
    await db
      .insert(pushSubscriptions)
      .values({ endpoint, userId, p256dh: keys.p256dh, auth: keys.auth, createdAt: Date.now() })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh: keys.p256dh, auth: keys.auth },
        setWhere: eq(pushSubscriptions.userId, userId),
      });
    return c.json({ ok: true });
  })
  .delete("/assinatura", jsonBody(z.object({ endpoint: z.string() }), "Pedido inválido."), async (c) => {
    const body = c.req.valid("json");
    await createDb(c.env.DB)
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, body.endpoint), eq(pushSubscriptions.userId, c.get("userId"))));
    return c.json({ ok: true });
  })
  /** Agenda o aviso de fim de bloco (alarme do Durable Object do usuário). */
  .post(
    "/fim-de-bloco",
    jsonBody(z.object({ endsAt: z.number().int(), subject: z.string().max(200) }), "Horário inválido."),
    async (c) => {
    const body = c.req.valid("json");
    const now = Date.now();
    if (body.endsAt <= now || body.endsAt > now + 12 * 3_600_000)
      return c.json({ error: "Horário inválido." }, 400);
    const userId = c.get("userId");
    await c.env.USER_HUB.getByName(userId).scheduleBlockEnd(userId, body.endsAt, body.subject);
    return c.json({ ok: true });
    },
  )
  .delete("/fim-de-bloco", async (c) => {
    await c.env.USER_HUB.getByName(c.get("userId")).cancelBlockEnd();
    return c.json({ ok: true });
  });
