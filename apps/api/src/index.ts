import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { createDb, user } from "@meu-edital/db";
import { eq } from "drizzle-orm";
import { createAuth } from "./auth/auth";
import { userData } from "./data/access";
import { type AppContext, emailEnabled, googleEnabled } from "./env";
import { clientIp, rateLimit } from "./http/rateLimit";
import { requireUser } from "./http/session";

const app = new Hono<AppContext>().basePath("/api");

app.use("*", secureHeaders());

// Só as ações (POST) contam para o limite; ler a sessão não.
app.use("/auth/*", async (c, next) =>
  c.req.method === "POST"
    ? rateLimit("AUTH_LIMITER", (ctx) => `${clientIp(ctx)}:${ctx.req.path}`)(c, next)
    : next(),
);
app.on(["GET", "POST"], "/auth/*", (c) =>
  createAuth(c.env, (promise) => c.executionCtx.waitUntil(promise)).handler(c.req.raw),
);

app.use("/me/*", requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")));
app.use("/me", requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")));

const routes = app
  .get("/health", (c) => c.json({ ok: true }))
  /** O que a tela de login precisa saber antes de existir sessão. */
  .get("/config", (c) =>
    c.json({
      turnstileSiteKey: c.env.TURNSTILE_SECRET_KEY ? c.env.TURNSTILE_SITE_KEY || null : null,
      googleEnabled: googleEnabled(c.env),
      emailEnabled: emailEnabled(c.env),
    }),
  )
  .get("/me", async (c) => {
    const db = createDb(c.env.DB);
    const userId = c.get("userId");
    const [profile] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, userId));
    const [settings] = await userData(db, userId).active("userSettings");
    return c.json({ user: profile, activeExamId: settings?.activeExamId ?? null });
  });

routes.notFound((c) => c.json({ error: "Rota não encontrada." }, 404));
routes.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Algo deu errado do nosso lado. Tente de novo." }, 500);
});

/** Tipo das rotas para o cliente tipado (`hc`) do app web. */
export type ApiRoutes = typeof routes;
export default routes;
