import { platform } from "@platform/index";
import { queryOptions } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth";
import { queryClient } from "./query";

type SessionUser = { id: string; name: string; email: string };
const CACHED_USER_KEY = "sessao_offline";

function readCachedUser(): SessionUser | null {
  try {
    const raw = platform.preferences.get(CACHED_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    return parsed.id && parsed.email ? { id: parsed.id, name: parsed.name ?? "", email: parsed.email } : null;
  } catch {
    return null;
  }
}

export function clearCachedSessionUser() {
  platform.preferences.remove(CACHED_USER_KEY);
}

/** Sessão guardada por alguns minutos: navegar entre telas não refaz a chamada. */
const sessionQuery = queryOptions({
  queryKey: ["sessao"],
  queryFn: async (): Promise<SessionUser | null> => {
    try {
      const response = await authClient.getSession();
      const user = response.data?.user;
      if (user) {
        const snapshot = { id: user.id, name: user.name, email: user.email };
        platform.preferences.set(CACHED_USER_KEY, JSON.stringify(snapshot));
        return snapshot;
      }
      if (!response.error) clearCachedSessionUser();
      // Falha de rede sem resposta do servidor: deixa abrir offline com o banco local.
      return response.error && !response.error.status ? readCachedUser() : null;
    } catch {
      return readCachedUser();
    }
  },
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
  return { user };
}

/** Para Entrar e Criar conta: com sessão, vai para o app. */
export async function requireGuest() {
  if (await hasSession()) throw redirect({ to: "/" });
}

/** Lê um parâmetro de busca opcional em texto. */
export const searchText = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;
