import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { createDb } from "@meu-edital/db";
import { routes } from "./app";
import { runHousekeeping } from "./data/cleanup";
import type { AppContext } from "./env";
import { oauthRoutes, SCOPES } from "./mcp/oauth";
import { mcpApiHandler } from "./mcp/server";
import { sendDueReviewReminders } from "./push/reminders";

const oauthHeaders = secureHeaders();

/** Tudo que não é /mcp: a API em /api, a autorização OAuth e o consentimento. */
export const app = new Hono<AppContext>()
  .use("/authorize", oauthHeaders)
  .use("/oauth/*", oauthHeaders)
  .route("/", oauthRoutes)
  .route("/", routes);

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      level: "error",
      requestId: c.req.header("cf-ray") ?? null,
      method: c.req.method,
      path: c.req.path,
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  return c.json({ error: "Algo deu errado do nosso lado. Tente de novo." }, 500);
});

const RATE_LIMITED_OAUTH_PATHS = new Set(["/oauth/register", "/oauth/token", "/authorize"]);

/**
 * O Worker. O OAuthProvider atende /mcp (com token validado), /oauth/token,
 * /oauth/register e a descoberta; o resto vai para o app Hono. Os arquivos
 * do app web são servidos como static assets antes de chegar aqui.
 * Cacheado por `APP_URL` para sempre refletir o `env` da requisição.
 */
const providers = new Map<string, OAuthProvider>();

function getProvider(appUrl: string) {
  let instance = providers.get(appUrl);
  if (!instance) {
    instance = new OAuthProvider({
      apiRoute: "/mcp",
      apiHandler: mcpApiHandler as never,
      defaultHandler: app as never,
      authorizeEndpoint: "/authorize",
      tokenEndpoint: "/oauth/token",
      clientRegistrationEndpoint: "/oauth/register",
      // Claude e Perplexity se registram (DCR); o ChatGPT prefere se identificar
      // por um documento de metadados numa URL (CIMD).
      clientIdMetadataDocumentEnabled: true,
      scopesSupported: [...SCOPES],
      resourceMetadata: {
        resource: `${appUrl}/mcp`,
        authorization_servers: [appUrl],
      },
    });
    providers.set(appUrl, instance);
  }
  return instance;
}

/** O Worker: requisições pelo OAuthProvider e o lembrete diário pelo cron. */
export default {
  async fetch(request: Request, runtimeEnv: Env, ctx: ExecutionContext) {
    const pathname = new URL(request.url).pathname;
    if (RATE_LIMITED_OAUTH_PATHS.has(pathname)) {
      const ip = request.headers.get("cf-connecting-ip") ?? "local";
      const { success } = await runtimeEnv.AUTH_LIMITER.limit({ key: `oauth:${ip}:${pathname}` });
      if (!success)
        return Response.json({ error: "Muitas tentativas. Espere um minuto e tente de novo." }, { status: 429 });
    }
    return getProvider(runtimeEnv.APP_URL).fetch(request, runtimeEnv, ctx);
  },
  scheduled(_controller: ScheduledController, runtimeEnv: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      Promise.allSettled([
        sendDueReviewReminders(runtimeEnv).catch((error) =>
          console.error(JSON.stringify({ level: "error", job: "reminders", message: String(error) })),
        ),
        runHousekeeping(createDb(runtimeEnv.DB)).catch((error) =>
          console.error(JSON.stringify({ level: "error", job: "housekeeping", message: String(error) })),
        ),
      ]),
    );
  },
} satisfies ExportedHandler<Env>;

export { UserHub } from "./sync/hub";
export type { ApiRoutes } from "./app";
