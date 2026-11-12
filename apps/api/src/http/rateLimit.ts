import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { AppContext } from "../env";

type Limiter = "AUTH_LIMITER" | "API_LIMITER";

/** Limite aproximado por local da Cloudflare, pela chave informada. */
export const rateLimit = (limiter: Limiter, key: (c: Context<AppContext>) => string) =>
  createMiddleware<AppContext>(async (c, next) => {
    const { success } = await c.env[limiter].limit({ key: key(c) });
    if (!success)
      return c.json({ error: "Muitas tentativas. Espere um minuto e tente de novo." }, 429);
    await next();
  });

export const clientIp = (c: Context<AppContext>) =>
  c.req.header("cf-connecting-ip") || "local";
