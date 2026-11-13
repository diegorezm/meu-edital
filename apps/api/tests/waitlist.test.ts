import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { app } from "../src/index";
import { call, uniqueEmail, verifiedUser } from "./helpers";

const waitlistMode = { SIGNUP_MODE: "waitlist" } as const;

describe("cadastro fechado (SIGNUP_MODE=waitlist)", () => {
  it("recusa criar conta, mas deixa entrar quem já tem", async () => {
    const { email, password } = await verifiedUser();
    const signUp = await call("/api/auth/sign-up/email", {
      body: { name: "Caio", email: uniqueEmail(), password: "senha-forte-123" },
      vars: waitlistMode,
      ip: "192.0.2.10",
    });
    expect(signUp.status).toBeGreaterThanOrEqual(400);

    const signIn = await call("/api/auth/sign-in/email", {
      body: { email, password },
      vars: waitlistMode,
      ip: "192.0.2.10",
    });
    expect(signIn.status).toBe(200);
  });

  it("avisa o app pela configuração pública", async () => {
    const closed = await call("/api/config", { vars: waitlistMode });
    expect(await closed.json()).toMatchObject({ signupOpen: false });
    const open = await call("/api/config");
    expect(await open.json()).toMatchObject({ signupOpen: true });
  });
});

describe("lista de espera", () => {
  const count = async (email: string) => {
    const row = await env.DB.prepare("select count(*) as n from waitlist where email = ?")
      .bind(email)
      .first<{ n: number }>();
    return row?.n ?? 0;
  };

  it("guarda o e-mail uma vez só e responde igual para repetido", async () => {
    const email = uniqueEmail();
    const first = await call("/api/lista-de-espera", { body: { email: email.toUpperCase() }, ip: "192.0.2.20" });
    const again = await call("/api/lista-de-espera", { body: { email, source: "app" }, ip: "192.0.2.20" });
    expect(first.status).toBe(200);
    expect(await again.json()).toEqual(await first.clone().json());
    expect(await count(email)).toBe(1);
  });

  it("recusa e-mail inválido", async () => {
    const response = await call("/api/lista-de-espera", { body: { email: "sem-arroba" }, ip: "192.0.2.21" });
    expect(response.status).toBe(400);
  });

  it("não expõe a lista nem os dados de outras pessoas", async () => {
    await call("/api/lista-de-espera", { body: { email: uniqueEmail() }, ip: "192.0.2.22" });
    const { cookie } = await verifiedUser();
    expect((await call("/api/lista-de-espera", { cookie })).status).toBe(404);
  });

  it("libera CORS só para o site de divulgação", async () => {
    const preflight = async (origin: string) => {
      const ctx = createExecutionContext();
      const response = await app.fetch(
        new Request(`${env.APP_URL}/api/lista-de-espera`, {
          method: "OPTIONS",
          headers: { origin, "access-control-request-method": "POST" },
        }),
        env,
        ctx,
      );
      await waitOnExecutionContext(ctx);
      return response.headers.get("access-control-allow-origin");
    };
    expect(await preflight(env.SITE_URL)).toBe(env.SITE_URL);
    expect(await preflight("https://site-estranho.com")).toBeNull();
  });
});
