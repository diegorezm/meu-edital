/**
 * Chamadas à API do mesmo Worker. Mesma origem: o cookie de sessão vai junto.
 * Os dados de estudo nunca passam por aqui: eles vão pelo sync (`useStore`).
 */
export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Falha em ${path}: ${response.status}`);
  return response.json() as Promise<T>;
}

/** POST/DELETE com JSON. Lança erro com a mensagem amigável da API, quando houver. */
export async function sendJson<T>(path: string, method: "POST" | "DELETE", body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
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
  /** Chave pública do Web Push; null quando o servidor não envia avisos. */
  vapidPublicKey: string | null;
};

let config: Promise<PublicConfig> | undefined;
/** Configuração pública (Turnstile, Google), buscada uma vez por carregamento. */
export const publicConfig = () => (config ??= getJson<PublicConfig>("/config"));
