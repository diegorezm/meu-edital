import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { betterAuth } from "better-auth";
import { bearer, captcha } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { account, createDb, session, user, verification } from "@meu-edital/db";
import { uid } from "@meu-edital/domain";
import { type AppEnv, emailEnabled, googleEnabled, NATIVE_ORIGINS, signupOpen } from "../env";
import { resetPasswordEmail, verificationEmail } from "./emails";
import { createMailer, type Email } from "./mailer";

type WaitUntil = (promise: Promise<unknown>) => void;

async function revokeAllOAuthGrants(env: AppEnv, userId: string) {
  const oauth = (env as AppEnv & { OAUTH_PROVIDER?: OAuthHelpers }).OAUTH_PROVIDER;
  if (!oauth) return;
  let cursor: string | undefined;
  do {
    const page = await oauth.listUserGrants(userId, { limit: 100, ...(cursor ? { cursor } : {}) });
    await Promise.allSettled(page.items.map((grant) => oauth.revokeGrant(grant.id, userId)));
    cursor = page.cursor;
  } while (cursor);
}

/**
 * Auth por e-mail e senha (com verificação e recuperação), Google quando
 * configurado e exclusão de conta. A web usa cookie de mesma origem; o app
 * mobile usará o token do plugin `bearer` (cabeçalho `Authorization`).
 * Criado por requisição porque os bindings só existem dentro dela.
 */
export function createAuth(env: AppEnv, waitUntil: WaitUntil) {
  const mailer = createMailer(env);
  const canEmail = emailEnabled(env);
  // Não espera o envio, para a resposta não revelar se o e-mail existe.
  const send = (email: Email) =>
    waitUntil(
      mailer.send(email).catch((error) => console.error("Falha ao enviar e-mail", error)),
    );
  return betterAuth({
    appName: "Meu Edital",
    baseURL: env.APP_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL, ...env.EXTRA_ORIGINS.split(",").filter(Boolean), ...NATIVE_ORIGINS],
    database: drizzleAdapter(createDb(env.DB), {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    // Sem envio real de e-mail, não há como confirmar o endereço nem provar a
    // posse da conta: o cadastro entra direto e a recuperação de senha some.
    emailAndPassword: {
      enabled: true,
      disableSignUp: !signupOpen(env),
      requireEmailVerification: canEmail,
      minPasswordLength: 8,
      revokeSessionsOnPasswordReset: true,
      ...(canEmail
        ? { sendResetPassword: async ({ user, url }) => send(resetPasswordEmail(user, url)) }
        : {}),
    },
    emailVerification: {
      sendOnSignUp: canEmail,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => send(verificationEmail(user, url)),
    },
    user: {
      deleteUser: {
        enabled: true,
        afterDelete: async (deleted) => {
          const db = createDb(env.DB);
          await Promise.allSettled([
            revokeAllOAuthGrants(env, deleted.id),
            env.USER_HUB.getByName(deleted.id).destroy(),
            db.delete(verification).where(eq(verification.identifier, deleted.email)),
          ]);
        },
      },
    },
    socialProviders: googleEnabled(env)
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
            prompt: "select_account",
            disableSignUp: !signupOpen(env),
          },
        }
      : {},
    plugins: [
      bearer(),
      ...(env.TURNSTILE_SECRET_KEY
        ? [
            captcha({
              provider: "cloudflare-turnstile",
              secretKey: env.TURNSTILE_SECRET_KEY,
              endpoints: ["/sign-up/email", "/request-password-reset"],
            }),
          ]
        : []),
    ],
    // O limite fica no binding de rate limiting da Cloudflare (http/rateLimit.ts):
    // o limitador em memória do Better Auth não é compartilhado entre isolates.
    rateLimit: { enabled: false },
    advanced: {
      database: { generateId: () => uid() },
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
