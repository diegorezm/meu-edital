import type { Email } from "./mailer";

type Recipient = { email: string; name: string };

export const verificationEmail = (user: Recipient, url: string): Email => ({
  to: user.email,
  subject: "Confirme seu e-mail no Meu Edital",
  text: [
    `Olá, ${user.name}!`,
    "Falta só confirmar seu e-mail para começar a jornada:",
    url,
    "Se não foi você que criou a conta, ignore esta mensagem.",
  ].join("\n\n"),
});

export const resetPasswordEmail = (user: Recipient, url: string): Email => ({
  to: user.email,
  subject: "Redefina sua senha do Meu Edital",
  text: [
    `Olá, ${user.name}!`,
    "Recebemos um pedido para trocar sua senha. O link vale por uma hora:",
    url,
    "Se não foi você, ignore esta mensagem. Sua senha continua a mesma.",
  ].join("\n\n"),
});
