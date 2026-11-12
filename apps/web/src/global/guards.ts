import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth";

const hasSession = async () => Boolean((await authClient.getSession()).data);

/** Para rotas do app: sem sessão, vai para Entrar. */
export async function requireSession() {
  if (!(await hasSession())) throw redirect({ to: "/entrar" });
}

/** Para Entrar e Criar conta: com sessão, vai para o app. */
export async function requireGuest() {
  if (await hasSession()) throw redirect({ to: "/" });
}

/** Lê um parâmetro de busca opcional em texto. */
export const searchText = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;
