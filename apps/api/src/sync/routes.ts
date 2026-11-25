import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { createDb } from "@meu-edital/db";
import { PushRequestSchema } from "@meu-edital/sync";
import { syncData } from "../data/sync";
import { type AppContext, NATIVE_ORIGINS } from "../env";
import { rateLimit } from "../http/rateLimit";
import { requireUser } from "../http/session";
import { createWsTicket } from "../http/wsTicket";
import { requireConsent } from "../legal/routes";

/** Lotes maiores que isso são recusados antes de carregar em memória. */
const MAX_BODY_BYTES = 1_000_000;

export const syncRoutes = new Hono<AppContext>()
  .use(requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")), requireConsent)
  .post(
    "/push",
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => c.json({ error: "Lote grande demais. Envie em partes menores." }, 413),
    }),
    async (c) => {
      const parsed = PushRequestSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) return c.json({ error: "Formato de lote inválido." }, 400);

      const userId = c.get("userId");
      const data = syncData(createDb(c.env.DB), userId);
      const result = await data.push(parsed.data.mutations);
      c.executionCtx.waitUntil(
        c.env.USER_HUB.getByName(userId)
          .notify(result.version)
          .catch((error) => console.error("Falha ao avisar aparelhos", error)),
      );
      return c.json(result);
    },
  )
  .get("/pull", async (c) => {
    const since = Number(c.req.query("since") ?? 0);
    if (!Number.isInteger(since) || since < 0) return c.json({ error: "Cursor inválido." }, 400);
    const data = syncData(createDb(c.env.DB), c.get("userId"));
    return c.json(await data.pull(since));
  })
  /** Ticket efêmero (30 s) para abrir o WebSocket sem expor o token Bearer na URL. */
  .post("/ws-ticket", async (c) => {
    const ticket = await createWsTicket(c.get("userId"), c.env.BETTER_AUTH_SECRET);
    return c.json({ ticket });
  })
  /** WebSocket de avisos: "versão nova, faça pull". */
  .get("/ws", (c) => {
    if (c.req.header("upgrade")?.toLowerCase() !== "websocket")
      return c.json({ error: "Esperava um WebSocket." }, 426);
    const origin = c.req.header("origin");
    const allowed = [c.env.APP_URL, ...c.env.EXTRA_ORIGINS.split(",").filter(Boolean), ...NATIVE_ORIGINS];
    if (origin && !allowed.includes(origin))
      return c.json({ error: "Origem não autorizada." }, 403);
    return c.env.USER_HUB.getByName(c.get("userId")).fetch(c.req.raw);
  });
