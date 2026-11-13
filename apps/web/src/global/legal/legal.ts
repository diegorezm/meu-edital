import { platform } from "@platform/index";
import { getJson, sendJson } from "../api";

export type LegalDocument = "termos" | "privacidade";
export type PendingDocument = {
  document: LegalDocument;
  version: string;
  changes: string[];
  first: boolean;
};
type Accepted = { document: LegalDocument; version: string };

export const LEGAL_TITLES: Record<LegalDocument, string> = {
  termos: "Termos de Uso",
  privacidade: "Política de Privacidade",
};
export const LEGAL_PATHS = { termos: "/termos", privacidade: "/privacidade" } as const;

export const currentLegal = () =>
  getJson<{ documents: Accepted[] }>("/legal").then((r) =>
    r.documents.map(({ document, version }) => ({ document, version })),
  );
export const pendingLegal = () =>
  getJson<{ pending: PendingDocument[] }>("/legal/aceite").then((r) => r.pending);
export const acceptLegal = (documents: Accepted[]) =>
  sendJson<{ ok: true }>("/legal/aceite", "POST", { documents });

/**
 * Aceite marcado no cadastro, antes de existir sessão (o e-mail ainda vai ser
 * confirmado). Fica no aparelho e é registrado no primeiro acesso.
 */
const SIGNUP_KEY = "aceite-no-cadastro";

export async function rememberSignupAcceptance() {
  platform.preferences.set(SIGNUP_KEY, JSON.stringify(await currentLegal()));
}

/** Esquece o aceite do cadastro (depois de registrado na API). */
export function clearSignupAcceptance() {
  platform.preferences.remove(SIGNUP_KEY);
}

/** Aceite feito no cadastro, se ainda não foi registrado. Não apaga: ver `clearSignupAcceptance`. */
export function peekSignupAcceptance(): Accepted[] | null {
  const raw = platform.preferences.get(SIGNUP_KEY);
  try {
    return raw ? (JSON.parse(raw) as Accepted[]) : null;
  } catch {
    return null;
  }
}

/** Avisa a interface quando a API recusa por falta de aceite (409). */
const listeners = new Set<() => void>();
export const onConsentRequired = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const notifyConsentRequired = () => listeners.forEach((l) => l());
