import { createAuthClient } from "better-auth/react";

/** Cliente de auth. Na web, a sessão vive em cookie HttpOnly da mesma origem. */
export const authClient = createAuthClient();

export const useSession = authClient.useSession;

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha não conferem.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar. Mandamos um link novo.",
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail. Que tal entrar?",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com esse e-mail. Que tal entrar?",
  PASSWORD_TOO_SHORT: "A senha precisa de pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "Essa senha é longa demais.",
  INVALID_EMAIL: "Esse e-mail não parece válido.",
  INVALID_TOKEN: "Esse link expirou ou já foi usado. Peça um novo.",
  INVALID_PASSWORD: "Senha incorreta.",
  MISSING_RESPONSE: "Confirme que você não é um robô.",
  VERIFICATION_FAILED: "Não conseguimos confirmar que você não é um robô. Tente de novo.",
};

/** Mensagem amigável para um erro do Better Auth. */
export function authErrorMessage(error: { code?: string; status?: number } | null | undefined) {
  if (!error) return "";
  if (error.code && messages[error.code]) return messages[error.code];
  if (error.status === 429) return "Muitas tentativas. Espere um minuto e tente de novo.";
  return "Não deu certo agora. Confira a conexão e tente de novo.";
}
