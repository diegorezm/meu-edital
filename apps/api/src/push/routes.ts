import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createDb, pushSubscriptions } from "@meu-edital/db";
import type { AppContext } from "../env";
import { rateLimit } from "../http/rateLimit";
import { requireUser } from "../http/session";
import { requireConsent } from "../legal/routes";

const SubscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Assinaturas de Web Push e o aviso de fim de bloco com a aba fechada. */
export const pushRoutes = new Hono<AppContext>()
  .use(requireUser, requireConsent, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .post("/assinatura", async (c) => {
    const parsed = SubscriptionSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Assinatura inválida." }, 400);
    const { endpoint, keys } = parsed.data;
    const userId = c.get("userId");
    await createDb(c.env.DB)
      .insert(pushSubscriptions)
      .values({ endpoint, userId, p256dh: keys.p256dh, auth: keys.auth, createdAt: Date.now() })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, p256dh: keys.p256dh, auth: keys.auth },
      });
    return c.json({ ok: true });
  })
  .delete("/assinatura", async (c) => {
    const body = z.object({ endpoint: z.string() }).safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "Pedido inválido." }, 400);
    await createDb(c.env.DB)
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, body.data.endpoint), eq(pushSubscriptions.userId, c.get("userId"))));
    return c.json({ ok: true });
  })
  /** Agenda o aviso de fim de bloco (alarme do Durable Object do usuário). */
  .post("/fim-de-bloco", async (c) => {
    const body = z
      .object({ endsAt: z.number().int(), subject: z.string().max(200) })
      .safeParse(await c.req.json().catch(() => null));
    const now = Date.now();
    if (!body.success || body.data.endsAt <= now || body.data.endsAt > now + 12 * 3_600_000)
      return c.json({ error: "Horário inválido." }, 400);
    const userId = c.get("userId");
    await c.env.USER_HUB.getByName(userId).scheduleBlockEnd(userId, body.data.endsAt, body.data.subject);
    return c.json({ ok: true });
  })
  .delete("/fim-de-bloco", async (c) => {
    await c.env.USER_HUB.getByName(c.get("userId")).cancelBlockEnd();
    return c.json({ ok: true });
  });
