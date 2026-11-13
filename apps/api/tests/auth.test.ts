import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { call, cookiesFrom, lastLinkTo, uniqueEmail, verifiedUser } from "./helpers";

describe("cadastro e login por e-mail", () => {
  it("exige confirmar o e-mail antes de entrar", async () => {
    const email = uniqueEmail();
    const password = "senha-forte-123";
    const signUp = await call("/api/auth/sign-up/email", {
      body: { name: "Bruno", email, password },
    });
    expect(signUp.status).toBe(200);

    const blocked = await call("/api/auth/sign-in/email", { body: { email, password } });
    expect(blocked.status).toBe(403);

    const verified = await call(lastLinkTo(email));
    expect(verified.status).toBe(302);
    expect(cookiesFrom(verified)).toContain("session_token");

    const signIn = await call("/api/auth/sign-in/email", { body: { email, password } });
    expect(signIn.status).toBe(200);
  });

  it("aceita a sessão por cookie e por token bearer", async () => {
    const { email, password } = await verifiedUser();
    const signIn = await call("/api/auth/sign-in/email", { body: { email, password } });
    const token = signIn.headers.get("set-auth-token");
    expect(token).toBeTruthy();

    const byCookie = await call("/api/me", { cookie: cookiesFrom(signIn) });
    const byBearer = await call("/api/me", { bearer: token! });
    expect(byCookie.status).toBe(200);
    expect(byBearer.status).toBe(200);
    expect(await byBearer.json()).toMatchObject({ user: { email } });
  });

  it("marca o cookie de sessão como HttpOnly e SameSite=Lax", async () => {
    const { email, password } = await verifiedUser();
    const signIn = await call("/api/auth/sign-in/email", { body: { email, password } });
    const cookie = signIn.headers.getSetCookie().find((c) => c.includes("session_token"))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("recusa rotas de dados sem sessão", async () => {
    expect((await call("/api/me")).status).toBe(401);
    expect((await call("/api/me", { bearer: "token-inventado" })).status).toBe(401);
  });
});

describe("recuperação de senha", () => {
  it("troca a senha pelo link do e-mail e derruba as sessões antigas", async () => {
    const { email, password, cookie } = await verifiedUser();
    const request = await call("/api/auth/request-password-reset", {
      body: { email, redirectTo: "/redefinir-senha" },
    });
    expect(request.status).toBe(200);

    const link = await call(lastLinkTo(email));
    const location = link.headers.get("location")!;
    const token = new URL(location, "http://x").searchParams.get("token")!;
    expect(token).toBeTruthy();

    const reset = await call("/api/auth/reset-password", {
      body: { token, newPassword: "outra-senha-456" },
    });
    expect(reset.status).toBe(200);

    expect((await call("/api/me", { cookie })).status).toBe(401);
    const oldPassword = await call("/api/auth/sign-in/email", { body: { email, password } });
    expect(oldPassword.status).toBe(401);
    const newPassword = await call("/api/auth/sign-in/email", {
      body: { email, password: "outra-senha-456" },
    });
    expect(newPassword.status).toBe(200);
  });

  it("responde igual para e-mail que não existe", async () => {
    const response = await call("/api/auth/request-password-reset", {
      body: { email: "ninguem@exemplo.com", redirectTo: "/redefinir-senha" },
    });
    expect(response.status).toBe(200);
  });
});

describe("exclusão de conta", () => {
  it("apaga o usuário e todos os dados dele", async () => {
    const { cookie, userId, password } = await verifiedUser();
    const now = Date.now();
    await env.DB.prepare(
      "insert into exams (id, user_id, updated_at, version, name, role, hours_per_week, created_at) values (?, ?, ?, 1, 'TRT', 'Técnico', 10, '2026-11-12')",
    )
      .bind(crypto.randomUUID(), userId, now)
      .run();

    const deleted = await call("/api/auth/delete-user", { body: { password }, cookie });
    expect(deleted.status).toBe(200);

    const left = await env.DB.prepare(
      "select (select count(*) from user where id = ?1) + (select count(*) from exams where user_id = ?1) + (select count(*) from session where user_id = ?1) as total",
    )
      .bind(userId)
      .first<{ total: number }>();
    expect(left?.total).toBe(0);
  });
});

describe("configuração pública", () => {
  it("informa que o Google está desligado sem credenciais", async () => {
    const response = await call("/api/config");
    expect(await response.json()).toEqual({
      turnstileSiteKey: null,
      googleEnabled: false,
      emailEnabled: true,
      vapidPublicKey: expect.any(String),
    });
  });
});

describe("rate limiting", () => {
  it("bloqueia excesso de tentativas de login do mesmo IP", async () => {
    const ip = "192.0.2.77";
    const attempt = () =>
      call("/api/auth/sign-in/email", {
        body: { email: "x@exemplo.com", password: "errada-123" },
        ip,
      });
    const statuses: number[] = [];
    for (let i = 0; i < 25; i += 1) statuses.push((await attempt()).status);
    expect(statuses.slice(0, 20).every((status) => status === 401)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});

describe("sem envio de e-mail (EMAIL_MODE=log)", () => {
  const vars = { EMAIL_MODE: "log" } as const;

  it("o cadastro entra direto, sem confirmação", async () => {
    const email = uniqueEmail();
    const signUp = await call("/api/auth/sign-up/email", {
      body: { name: "Caio", email, password: "senha-forte-123" },
      vars,
    });
    expect(signUp.status).toBe(200);
    const me = await call("/api/me", { cookie: cookiesFrom(signUp), vars });
    expect(me.status).toBe(200);
  });

  it("a recuperação de senha fica desligada", async () => {
    const response = await call("/api/auth/request-password-reset", {
      body: { email: "alguem@exemplo.com", redirectTo: "/redefinir-senha" },
      vars,
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
    const config = await call("/api/config", { vars });
    expect(await config.json()).toMatchObject({ emailEnabled: false });
  });
});

describe("app nativo", () => {
  it("libera CORS só para a origem do app e expõe o token", async () => {
    const preflight = await call("/api/me", { method: "OPTIONS" });
    expect(preflight.headers.get("access-control-allow-origin")).toBeNull();
    const { app } = await import("../src/index");
    const native = await app.fetch(
      new Request(`${env.APP_URL}/api/config`, { headers: { origin: "https://localhost" } }),
      env,
    );
    expect(native.headers.get("access-control-allow-origin")).toBe("https://localhost");
    expect(native.headers.get("access-control-expose-headers")).toContain("set-auth-token");
    const stranger = await app.fetch(
      new Request(`${env.APP_URL}/api/config`, { headers: { origin: "https://site-estranho.com" } }),
      env,
    );
    expect(stranger.headers.get("access-control-allow-origin")).toBeNull();
  });
});
