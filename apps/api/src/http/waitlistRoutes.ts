import { Hono } from "hono";
import { z } from "zod";
import { createDb, waitlist } from "@meu-edital/db";
import type { AppContext } from "../env";
import { clientIp, rateLimit } from "./rateLimit";
import { jsonBody } from "./validate";

const EntrySchema = z.object({
  email: z.email().max(254),
  source: z.enum(["site", "app"]).default("site"),
});

/** Confere o token do Turnstile na Cloudflare. Sem segredo, não há captcha. */
async function captchaOk(secret: string, token: string | undefined, ip: string) {
  if (!secret) return true;
  if (!token) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

/**
 * Lista de espera, pública (o site de divulgação e a tela de cadastro usam).
 * A resposta é a mesma para e-mail novo ou repetido, para não revelar quem
 * já está na lista.
 */
export const waitlistRoutes = new Hono<AppContext>()
  .use(rateLimit("AUTH_LIMITER", (c) => `${clientIp(c)}:lista-de-espera`))
  .post("/", jsonBody(EntrySchema, "Confira o e-mail."), async (c) => {
    const parsed = c.req.valid("json");
    const token = c.req.header("x-captcha-response");
    if (!(await captchaOk(c.env.TURNSTILE_SECRET_KEY, token, clientIp(c))))
      return c.json({ error: "Confirme que você não é um robô." }, 400);
    await createDb(c.env.DB)
      .insert(waitlist)
      .values({ email: parsed.email.trim().toLowerCase(), source: parsed.source, createdAt: Date.now() })
      .onConflictDoNothing();
    return c.json({ ok: true });
  });
