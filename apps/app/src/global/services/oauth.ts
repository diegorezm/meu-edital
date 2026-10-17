import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Login com Google na web: redireciona a página para o Google e volta para a
 * raiz do app. Na volta, o cliente do Supabase troca o código pela sessão.
 */
export async function signInWithGoogle(client: SupabaseClient) {
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
}

const errorKeys = ["error", "error_code", "error_description"];

/** Erro devolvido pelo provedor na URL de retorno (por exemplo, quando a pessoa cancela). */
export function readOAuthError(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const message =
    url.searchParams.get("error_description") || hash.get("error_description");
  return message ? message.replace(/\+/g, " ") : null;
}

/**
 * Tira o erro da URL. Roda depois da montagem: o Expo Router regrava a URL
 * inicial ao abrir e desfaria uma limpeza feita antes.
 */
export function clearOAuthError() {
  const url = new URL(window.location.href);
  for (const key of errorKeys) url.searchParams.delete(key);
  if (url.hash.includes("error")) url.hash = "";
  window.history.replaceState(window.history.state, "", url.toString());
}
