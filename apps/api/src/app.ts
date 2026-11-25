import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { createDb, user } from "@meu-edital/db";
import { eq } from "drizzle-orm";
import { createAuth } from "./auth/auth";
import { userData } from "./data/access";
import { type AppContext, emailEnabled, googleEnabled, NATIVE_ORIGINS, signupOpen } from "./env";
import { clientIp, rateLimit } from "./http/rateLimit";
import { exportRoutes } from "./http/exportRoutes";
import { proposalRoutes } from "./http/proposalRoutes";
import { requireUser } from "./http/session";
import { waitlistRoutes } from "./http/waitlistRoutes";
import { connectionRoutes } from "./mcp/oauth";
import { acceptancesData } from "./legal/acceptances";
import { legalRoutes } from "./legal/routes";
import { pushRoutes } from "./push/routes";
import { syncRoutes } from "./sync/routes";

const app = new Hono<AppContext>().basePath("/api");

// A resposta 101 do WebSocket tem cabeçalhos imutáveis; só pula nela.
const headers = secureHeaders();
app.use("*", (c, next) =>
  c.req.path === "/api/sync/ws" && c.req.header("upgrade")?.toLowerCase() === "websocket"
    ? next()
    : headers(c, next),
);

const PUBLIC_SITE_PATHS = new Set(["/api/config", "/api/lista-de-espera"]);

// O site de divulgação só lê /api/config e envia /api/lista-de-espera (sem
// credenciais). O app nativo (WebView) chama a API inteira com bearer/cookie.
app.use("*", (c, next) => {
  const origin = c.req.header("origin");
  if (origin && origin === c.env.SITE_URL && PUBLIC_SITE_PATHS.has(c.req.path)) {
    return cors({
      origin: c.env.SITE_URL,
      allowHeaders: ["content-type", "x-captcha-response"],
      credentials: false,
      allowMethods: ["GET", "POST", "OPTIONS"],
      maxAge: 600,
    })(c, next);
  }
  return cors({
    origin: (o) => (NATIVE_ORIGINS.includes(o) ? o : null),
    allowHeaders: ["authorization", "content-type", "x-captcha-response"],
    exposeHeaders: ["set-auth-token"],
    // O cliente do Better Auth manda `credentials: include`; sem isso o
    // navegador da WebView bloqueia a resposta.
    credentials: true,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    maxAge: 600,
  })(c, next);
});

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
  .route("/sync", syncRoutes)
  .route("/proposals", proposalRoutes)
  .route("/export", exportRoutes)
  .route("/push", pushRoutes)
  .route("/oraculo/conexoes", connectionRoutes)
  .route("/lista-de-espera", waitlistRoutes)
  .route("/legal", legalRoutes)
  .get("/health", (c) => c.json({ ok: true }))
  /** O que a tela de login precisa saber antes de existir sessão. */
  .get("/config", (c) =>
    c.json({
      turnstileSiteKey: c.env.TURNSTILE_SECRET_KEY ? c.env.TURNSTILE_SITE_KEY || null : null,
      googleEnabled: googleEnabled(c.env),
      emailEnabled: emailEnabled(c.env),
      signupOpen: signupOpen(c.env),
      vapidPublicKey: c.env.VAPID_PRIVATE_KEY ? c.env.VAPID_PUBLIC_KEY : null,
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
    const legalPending = await acceptancesData(db, userId).pending();
    return c.json({ user: profile, activeExamId: settings?.activeExamId ?? null, legalPending });
  });

routes.notFound((c) => c.json({ error: "Rota não encontrada." }, 404));
routes.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Algo deu errado do nosso lado. Tente de novo." }, 500);
});

/** Tipo das rotas para o cliente tipado (`hc`) do app web. */
export type ApiRoutes = typeof routes;
export { routes };
