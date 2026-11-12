import { Hono } from "hono";
import { createDb } from "@meu-edital/db";
import { PushRequestSchema } from "@meu-edital/sync";
import { syncData } from "../data/sync";
import type { AppContext } from "../env";
import { rateLimit } from "../http/rateLimit";
import { requireUser } from "../http/session";

/** Lotes maiores que isso são recusados antes de ler o corpo. */
const MAX_BODY_BYTES = 1_000_000;

export const syncRoutes = new Hono<AppContext>()
  .use(requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .post("/push", async (c) => {
    if (Number(c.req.header("content-length") ?? 0) > MAX_BODY_BYTES)
      return c.json({ error: "Lote grande demais. Envie em partes menores." }, 413);
    const parsed = PushRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Formato de lote inválido." }, 400);

    const userId = c.get("userId");
    const data = syncData(createDb(c.env.DB), userId);
    const result = await data.push(parsed.data.mutations);
    c.executionCtx.waitUntil(
      Promise.all([
        c.env.USER_HUB.getByName(userId).notify(result.version),
        data.pruneMutations(),
      ]).catch((error) => console.error("Falha ao avisar aparelhos", error)),
    );
    return c.json(result);
  })
  .get("/pull", async (c) => {
    const since = Number(c.req.query("since") ?? 0);
    if (!Number.isInteger(since) || since < 0) return c.json({ error: "Cursor inválido." }, 400);
    const data = syncData(createDb(c.env.DB), c.get("userId"));
    return c.json(await data.pull(since));
  })
  /** WebSocket de avisos: "versão nova, faça pull". */
  .get("/ws", (c) => {
    if (c.req.header("upgrade")?.toLowerCase() !== "websocket")
      return c.json({ error: "Esperava um WebSocket." }, 426);
    return c.env.USER_HUB.getByName(c.get("userId")).fetch(c.req.raw);
  });
