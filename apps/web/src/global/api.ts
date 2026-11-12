/**
 * Chamadas à API do mesmo Worker. Mesma origem: o cookie de sessão vai junto.
 * O cliente tipado (`hc`) entra na fase 2, junto com as rotas de sync.
 */
export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Falha em ${path}: ${response.status}`);
  return response.json() as Promise<T>;
}

export type PublicConfig = {
  turnstileSiteKey: string | null;
  googleEnabled: boolean;
  /** Falso enquanto não há envio de e-mail: sem confirmação e sem recuperar senha. */
  emailEnabled: boolean;
};

let config: Promise<PublicConfig> | undefined;
/** Configuração pública (Turnstile, Google), buscada uma vez por carregamento. */
export const publicConfig = () => (config ??= getJson<PublicConfig>("/config"));
