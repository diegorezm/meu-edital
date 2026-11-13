/**
 * Bindings gerados por `wrangler types` mais os segredos do Google, que só
 * existem quando configurados. Ao configurar, acrescente-os em
 * `secrets.required` no wrangler.jsonc.
 */
export type AppEnv = Env & {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

export type AppContext = {
  Bindings: AppEnv;
  Variables: { userId: string };
};

export const googleEnabled = (env: AppEnv) =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

/**
 * Sem domínio, os e-mails só vão para o log (EMAIL_MODE=log). Nesse caso o
 * cadastro não exige confirmação e a recuperação de senha fica desligada.
 */
export const emailEnabled = (env: AppEnv) => (env.EMAIL_MODE as string) !== "log";

/**
 * Origens do app nativo (WebView do Capacitor). Nelas não há cookie de mesma
 * origem: o app usa o token bearer, e a API libera CORS só para elas.
 */
export const NATIVE_ORIGINS = ["https://localhost", "capacitor://localhost"];
