import { createMiddleware } from "hono/factory";
import { createAuth } from "../auth/auth";
import type { AppContext } from "../env";

/**
 * Exige sessão válida (cookie ou `Authorization: Bearer`) e guarda o
 * `userId`. Rotas de dados leem o usuário só daqui, nunca do cliente.
 */
export const requireUser = createMiddleware<AppContext>(async (c, next) => {
  const auth = createAuth(c.env, (promise) => c.executionCtx.waitUntil(promise));
  const headers = new Headers(c.req.raw.headers);
  // WebSocket do navegador não manda cabeçalhos: o app nativo passa o token
  // na URL, e só nessa rota.
  const token = c.req.path.endsWith("/sync/ws") ? c.req.query("token") : undefined;
  if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
  const result = await auth.api.getSession({ headers });
  if (!result) return c.json({ error: "Entre na sua conta para continuar." }, 401);
  c.set("userId", result.user.id);
  await next();
});
