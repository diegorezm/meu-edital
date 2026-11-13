import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { outbox } from "../src/auth/mailer";
import { app } from "../src/index";

export const ORIGIN = env.APP_URL;

/** Chama o Worker como o navegador chamaria: mesma origem, JSON. */
export async function call(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    cookie?: string;
    bearer?: string;
    ip?: string;
    /** Sobrescreve variáveis do ambiente nesta chamada. */
    vars?: Partial<typeof env>;
  } = {},
) {
  const headers = new Headers({ origin: ORIGIN, "cf-connecting-ip": init.ip ?? "203.0.113.1" });
  if (init.body !== undefined) headers.set("content-type", "application/json");
  if (init.cookie) headers.set("cookie", init.cookie);
  if (init.bearer) headers.set("authorization", `Bearer ${init.bearer}`);
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request(`${ORIGIN}${path}`, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      redirect: "manual",
    }),
    init.vars ? { ...env, ...init.vars } : env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

/** Junta os cookies `Set-Cookie` da resposta em um cabeçalho `Cookie`. */
export function cookiesFrom(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

export function lastLinkTo(email: string): string {
  const message = [...outbox].reverse().find((item) => item.to === email);
  const link = message?.text.match(/https?:\/\/\S+/)?.[0];
  if (!link) throw new Error(`Nenhum link enviado para ${email}`);
  return link.replace(ORIGIN, "");
}

let counter = 0;
export const uniqueEmail = () => `estudante${Date.now()}${counter++}@exemplo.com`;

/** Cria uma conta, confirma o e-mail e devolve o cookie da sessão. */
export async function verifiedUser(password = "senha-forte-123") {
  const email = uniqueEmail();
  const ip = `198.51.100.${counter % 250}`;
  await call("/api/auth/sign-up/email", { body: { name: "Ana", email, password }, ip });
  const verified = await call(lastLinkTo(email), { ip });
  const cookie = cookiesFrom(verified);
  const me = await call("/api/me", { cookie });
  const { user } = (await me.json()) as { user: { id: string } };
  return { email, password, cookie, userId: user.id, ip };
}
