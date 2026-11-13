import { AuthorizationError, type OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { z } from "zod";
import { createAuth } from "../auth/auth";
import type { AppContext, AppEnv } from "../env";
import { rateLimit } from "../http/rateLimit";
import { requireUser } from "../http/session";

/** Escopos que uma IA pode pedir. Ler o contexto e propor; nunca escrever direto. */
export const SCOPES = ["estudo:ler", "estudo:propor"] as const;

const helpers = (env: AppEnv) => (env as AppEnv & { OAUTH_PROVIDER: OAuthHelpers }).OAUTH_PROVIDER;

async function sessionUser(env: AppEnv, request: Request, waitUntil: (p: Promise<unknown>) => void) {
  const session = await createAuth(env, waitUntil).api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

const withHeaders = (response: Response, headers: Headers) => {
  const out = new Response(response.body, response);
  headers.forEach((value, key) => out.headers.append(key, value));
  return out;
};

/**
 * Autorização OAuth do Oráculo com o login do próprio app. `/authorize`
 * valida o pedido, exige sessão e manda para a tela de consentimento do app
 * (`/oraculo/conectar`), que responde em `/oauth/consent`.
 */
export const oauthRoutes = new Hono<AppContext>()
  .get("/authorize", async (c) => {
    const oauth = helpers(c.env);
    let authRequest;
    try {
      authRequest = await oauth.parseAuthRequest(c.req.raw);
    } catch (error) {
      if (error instanceof AuthorizationError && error.redirectTo) return c.redirect(error.redirectTo, 302);
      return c.text("Pedido de autorização inválido.", 400);
    }
    const url = new URL(c.req.url);
    const user = await sessionUser(c.env, c.req.raw, (p) => c.executionCtx.waitUntil(p));
    if (!user) return c.redirect(`/entrar?volta=${encodeURIComponent(url.pathname + url.search)}`, 302);

    const consent = await oauth.describeConsent(authRequest);
    const { handle, headers } = await oauth.beginConsent(authRequest);
    const params = new URLSearchParams({
      handle,
      cliente: consent.clientName || "Aplicativo de IA",
      destino: consent.clientDomain ?? consent.redirectHost,
      escopos: authRequest.scope.filter((s) => (SCOPES as readonly string[]).includes(s)).join(" ") || SCOPES.join(" "),
    });
    return withHeaders(c.redirect(`/oraculo/conectar?${params}`, 302), headers);
  })
  .post(
    "/oauth/consent",
    rateLimit("AUTH_LIMITER", (c) => `consent:${c.req.header("cf-connecting-ip") ?? "local"}`),
    async (c) => {
      const body = z
        .object({ handle: z.string().min(1).max(500), decision: z.enum(["permitir", "recusar"]) })
        .safeParse(await c.req.json().catch(() => null));
      if (!body.success) return c.json({ error: "Pedido inválido." }, 400);
      const user = await sessionUser(c.env, c.req.raw, (p) => c.executionCtx.waitUntil(p));
      if (!user) return c.json({ error: "Entre na sua conta para continuar." }, 401);
      const oauth = helpers(c.env);
      try {
        if (body.data.decision === "recusar") {
          const denied = await oauth.denyConsent(c.req.raw, body.data.handle);
          return withHeaders(c.json({ redirectTo: denied.redirectTo }), denied.headers);
        }
        const approved = await oauth.approveConsent(c.req.raw, body.data.handle);
        const client = await oauth.describeConsent(approved.request);
        const scope = approved.request.scope.filter((s) => (SCOPES as readonly string[]).includes(s));
        const { redirectTo } = await oauth.completeAuthorization({
          request: approved.request,
          userId: user.id,
          scope: scope.length ? scope : [...SCOPES],
          metadata: { clientName: client.clientName, createdAt: Date.now() },
          props: { userId: user.id, clientName: client.clientName || "IA" },
        });
        return withHeaders(c.json({ redirectTo }), approved.headers);
      } catch (error) {
        if (error instanceof AuthorizationError)
          return c.json({ error: "Esse pedido expirou. Volte para a IA e conecte de novo." }, 400);
        throw error;
      }
    },
  );

/** Conexões de IA do estudante: listar e revogar (nas configurações do Oráculo). */
export const connectionRoutes = new Hono<AppContext>()
  .use(requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .get("/", async (c) => {
    const grants = await helpers(c.env).listUserGrants(c.get("userId"), { limit: 50 });
    return c.json({
      connections: grants.items.map((grant) => ({
        id: grant.id,
        name: (grant.metadata as { clientName?: string })?.clientName ?? "IA",
        scope: grant.scope,
        createdAt: (grant.metadata as { createdAt?: number })?.createdAt ?? null,
      })),
    });
  })
  .delete("/:id", async (c) => {
    await helpers(c.env).revokeGrant(c.req.param("id"), c.get("userId"));
    return c.json({ ok: true });
  });
