import { createMiddleware } from "hono/factory";
import { createAuth } from "../auth/auth";
import type { AppContext } from "../env";

/**
 * Exige sessão válida (cookie ou `Authorization: Bearer`) e guarda o
 * `userId`. Rotas de dados leem o usuário só daqui, nunca do cliente.
 */
export const requireUser = createMiddleware<AppContext>(async (c, next) => {
  const auth = createAuth(c.env, (promise) => c.executionCtx.waitUntil(promise));
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!result) return c.json({ error: "Entre na sua conta para continuar." }, 401);
  c.set("userId", result.user.id);
  await next();
});
