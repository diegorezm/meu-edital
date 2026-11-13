import { queryOptions } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth";
import { queryClient } from "./query";

/** Sessão guardada por alguns minutos: navegar entre telas não refaz a chamada. */
const sessionQuery = queryOptions({
  queryKey: ["sessao"],
  queryFn: async () => (await authClient.getSession()).data?.user ?? null,
  staleTime: 5 * 60_000,
});

/** Só a sessão existente fica em cache; sem sessão, a próxima rota pergunta de novo (ex.: logo após entrar). */
async function currentUser() {
  const user = await queryClient.fetchQuery(sessionQuery);
  if (!user) queryClient.removeQueries({ queryKey: sessionQuery.queryKey });
  return user;
}
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
