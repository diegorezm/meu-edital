import { platform } from "@platform/index";

/**
 * Na web, app e API dividem a origem: caminhos relativos e cookie de sessão.
 * No app nativo, a API fica em outro endereço (`VITE_API_ORIGIN` no build) e
 * a sessão vai como token bearer, guardado no armazenamento seguro.
 */
export const apiOrigin: string = platform.native ? (import.meta.env.VITE_API_ORIGIN ?? "") : "";

export const apiUrl = (path: string) => `${apiOrigin}${path}`;

const TOKEN_KEY = "sessao";
let token: string | null = null;

/** Carrega o token salvo. Chame antes de montar o app. */
export async function loadSessionToken() {
  if (platform.native) token = await platform.secureStorage.get(TOKEN_KEY);
}

export const sessionToken = () => token;

export async function saveSessionToken(value: string | null) {
  if (!platform.native) return;
  token = value;
  if (value) await platform.secureStorage.set(TOKEN_KEY, value);
  else await platform.secureStorage.remove(TOKEN_KEY);
}

/** fetch para a API com a sessão certa para a plataforma. */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: platform.native ? "omit" : "same-origin",
  });
}
