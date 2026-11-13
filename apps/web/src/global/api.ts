/**
 * Chamadas à API do mesmo Worker. Mesma origem: o cookie de sessão vai junto.
 * Os dados de estudo nunca passam por aqui: eles vão pelo sync (`useStore`).
 */
import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "./http";
import { queryClient } from "./query";

export async function getJson<T>(path: string): Promise<T> {
  const response = await apiFetch(`/api${path}`);
  if (!response.ok) throw new Error(`Falha em ${path}: ${response.status}`);
  return response.json() as Promise<T>;
}

/** POST/DELETE com JSON. Lança erro com a mensagem amigável da API, quando houver. */
export async function sendJson<T>(
  path: string,
  method: "POST" | "DELETE",
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  const response = await apiFetch(`/api${path}`, {
    method,
    headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Não deu certo agora. Tente de novo.");
  return payload;
}

export type PublicConfig = {
  turnstileSiteKey: string | null;
  googleEnabled: boolean;
  /** Falso enquanto não há envio de e-mail: sem confirmação e sem recuperar senha. */
  emailEnabled: boolean;
  /** Falso em produção enquanto o cadastro está fechado: só a lista de espera. */
  signupOpen: boolean;
  /** Chave pública do Web Push; null quando o servidor não envia avisos. */
  vapidPublicKey: string | null;
};

/** Configuração pública (Turnstile, Google, Web Push), buscada uma vez por carregamento. */
export const publicConfigQuery = queryOptions({
  queryKey: ["config"],
  queryFn: () => getJson<PublicConfig>("/config"),
  staleTime: Number.POSITIVE_INFINITY,
});

/** A mesma configuração fora de componentes, pelo cache do Query. */
export const publicConfig = () => queryClient.ensureQueryData(publicConfigQuery);
