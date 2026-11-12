import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth";

const currentUser = async () => (await authClient.getSession()).data?.user ?? null;
const hasSession = async () => Boolean(await currentUser());

/** Para rotas do app: sem sessão, vai para Entrar. Devolve o usuário. */
export async function requireSession() {
  const user = await currentUser();
  if (!user) throw redirect({ to: "/entrar" });
  return { user: { id: user.id, name: user.name, email: user.email } };
}

/** Para Entrar e Criar conta: com sessão, vai para o app. */
export async function requireGuest() {
  if (await hasSession()) throw redirect({ to: "/" });
}

/** Lê um parâmetro de busca opcional em texto. */
export const searchText = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;
