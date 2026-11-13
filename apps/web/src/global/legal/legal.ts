import { platform } from "@platform/index";
import { queryOptions } from "@tanstack/react-query";
import { getJson, sendJson } from "../api";
import { queryClient } from "../query";

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

/** Versões vigentes dos documentos. Mudam só com deploy: uma busca por carregamento. */
export const legalDocumentsQuery = queryOptions({
  queryKey: ["legal", "documentos"],
  queryFn: () =>
    getJson<{ documents: Accepted[] }>("/legal").then((r) =>
      r.documents.map(({ document, version }) => ({ document, version })),
    ),
  staleTime: Number.POSITIVE_INFINITY,
});

export type Acceptance = { document: LegalDocument; version: string; acceptedAt: number };

/** O que falta aceitar e o histórico, numa chamada só (o diálogo e a tela Conta dividem). */
export const acceptanceQuery = queryOptions({
  queryKey: ["legal", "aceite"],
  queryFn: () => getJson<{ pending: PendingDocument[]; history: Acceptance[] }>("/legal/aceite"),
});

export const currentLegal = () => queryClient.ensureQueryData(legalDocumentsQuery);
/** Sempre pergunta ao servidor: é chamado quando a API recusa por falta de aceite. */
export const pendingLegal = () => queryClient.fetchQuery({ ...acceptanceQuery, staleTime: 0 }).then((r) => r.pending);
export const acceptLegal = async (documents: Accepted[]) => {
  const result = await sendJson<{ ok: true }>("/legal/aceite", "POST", { documents });
  void queryClient.invalidateQueries({ queryKey: acceptanceQuery.queryKey });
  return result;
};

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
