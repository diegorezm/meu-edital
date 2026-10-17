import type { SupabaseClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

/**
 * Login com Google no celular: abre o Google numa sessão de autenticação do
 * sistema e recebe a volta pelo esquema do app (`meuedital://`). O código
 * recebido é trocado pela sessão (PKCE).
 */
export async function signInWithGoogle(client: SupabaseClient) {
  const redirectTo = Linking.createURL("/");
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw new Error(error.message);
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return;
  const { queryParams } = Linking.parse(result.url);
  const failure = queryParams?.error_description;
  if (failure) throw new Error(String(failure));
  const code = queryParams?.code;
  if (typeof code !== "string")
    throw new Error("O Google não devolveu um código de acesso.");
  const exchange = await client.auth.exchangeCodeForSession(code);
  if (exchange.error) throw new Error(exchange.error.message);
}

export function readOAuthError(): string | null {
  return null;
}

export function clearOAuthError() {}
