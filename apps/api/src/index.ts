import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { routes } from "./app";
import type { AppContext } from "./env";
import { oauthRoutes, SCOPES } from "./mcp/oauth";
import { mcpApiHandler } from "./mcp/server";
import { sendDueReviewReminders } from "./push/reminders";

/** Tudo que não é /mcp: a API em /api, a autorização OAuth e o consentimento. */
export const app = new Hono<AppContext>().route("/", oauthRoutes).route("/", routes);

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
  scopesSupported: [...SCOPES],
  resourceMetadata: {
    resource: `${env.APP_URL}/mcp`,
    authorization_servers: [env.APP_URL],
  },
});

/** O Worker: requisições pelo OAuthProvider e o lembrete diário pelo cron. */
export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => provider.fetch(request, env, ctx),
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(sendDueReviewReminders(env).catch((error) => console.error("Falha nos lembretes", error)));
  },
} satisfies ExportedHandler<Env>;

export { UserHub } from "./sync/hub";
export type { ApiRoutes } from "./app";
