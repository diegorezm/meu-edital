import { createMiddleware } from "hono/factory";
import { createAuth } from "../auth/auth";
import type { AppContext } from "../env";
import { verifyWsTicket } from "./wsTicket";

/**
 * Exige sessão válida (cookie, `Authorization: Bearer` ou ticket efêmero no
 * WebSocket) e guarda o `userId`. Rotas de dados leem o usuário só daqui.
 */
export const requireUser = createMiddleware<AppContext>(async (c, next) => {
  if (c.req.path.endsWith("/sync/ws")) {
    const ticket = c.req.query("ticket");
    if (ticket) {
      const userId = await verifyWsTicket(ticket, c.env.BETTER_AUTH_SECRET);
      if (!userId) return c.json({ error: "Ticket de conexão inválido ou expirado." }, 401);
      c.set("userId", userId);
      await next();
      return;
    }
  }
  const auth = createAuth(c.env, (promise) => c.executionCtx.waitUntil(promise));
  const headers = new Headers(c.req.raw.headers);
  const result = await auth.api.getSession({ headers });
  if (!result) return c.json({ error: "Entre na sua conta para continuar." }, 401);
  c.set("userId", result.user.id);
  await next();
});
