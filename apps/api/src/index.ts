import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { env } from "cloudflare:workers";
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
  console.error(error);
  return c.json({ error: "Algo deu errado do nosso lado. Tente de novo." }, 500);
});

const RATE_LIMITED_OAUTH_PATHS = new Set(["/oauth/register", "/oauth/token", "/authorize"]);

/**
 * O Worker. O OAuthProvider atende /mcp (com token validado), /oauth/token,
 * /oauth/register e a descoberta; o resto vai para o app Hono. Os arquivos
 * do app web são servidos como static assets antes de chegar aqui.
 */
const provider = new OAuthProvider({
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
    resource: `${env.APP_URL}/mcp`,
    authorization_servers: [env.APP_URL],
  },
});

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
    return provider.fetch(request, runtimeEnv, ctx);
  },
  scheduled(_controller: ScheduledController, runtimeEnv: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      Promise.allSettled([
        sendDueReviewReminders(runtimeEnv).catch((error) => console.error("Falha nos lembretes", error)),
        runHousekeeping(createDb(runtimeEnv.DB)).catch((error) => console.error("Falha na limpeza diária", error)),
      ]),
    );
  },
} satisfies ExportedHandler<Env>;

export { UserHub } from "./sync/hub";
export type { ApiRoutes } from "./app";
