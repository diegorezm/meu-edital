import type { AppEnv } from "../env";

export type Email = { to: string; subject: string; text: string };
export type Mailer = { send(email: Email): Promise<void> };

/**
 * Sem domínio próprio ainda, os e-mails não saem de verdade: no modo `log`
 * eles vão para o log do Worker (`wrangler tail`). O modo `memory` guarda as
 * mensagens em `outbox`, para os testes lerem os links.
 * Quando houver domínio, entra aqui o Cloudflare Email Service.
 */
export const outbox: Email[] = [];

export function createMailer(env: AppEnv): Mailer {
  const mode = env.EMAIL_MODE as string;
  if (mode === "memory")
    return {
      async send(email) {
        outbox.push(email);
      },
    };
  return {
    async send(email) {
      console.log(JSON.stringify({ event: "email", ...email }));
    },
  };
}
