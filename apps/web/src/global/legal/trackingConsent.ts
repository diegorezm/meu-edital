import { tracking, type TrackingChoices } from "@platform/tracking";
import { getJson, sendJson } from "../api";

type ServerSaved = { choices: TrackingChoices; policyVersion: string } | null;

let privacyVersion: Promise<string> | undefined;
/** Versão vigente da política de privacidade, buscada uma vez. */
export const currentPrivacyVersion = () =>
  (privacyVersion ??= getJson<{ documents: { document: string; version: string }[] }>("/legal").then(
    (r) => r.documents.find((d) => d.document === "privacidade")?.version ?? "",
  ));

/** Salva no aparelho e, com sessão, no servidor (prova e outros aparelhos). */
export async function saveTrackingChoices(choices: TrackingChoices, signedIn: boolean) {
  tracking.save(choices, await currentPrivacyVersion());
  if (signedIn) await sendJson("/legal/rastreamento", "POST", choices).catch(() => undefined);
}

/**
 * Ao entrar na conta: se o servidor tem escolha mais nova que o aparelho, usa
 * a do servidor; se só o aparelho tem, envia para o servidor.
 */
export async function syncTrackingChoices() {
  const { saved } = await getJson<{ saved: ServerSaved }>("/legal/rastreamento");
  const local = tracking.saved();
  if (saved && (!local || local.policyVersion < saved.policyVersion))
    tracking.save(saved.choices, saved.policyVersion);
  else if (local && !saved) await sendJson("/legal/rastreamento", "POST", local.choices);
}

/** Abre as preferências de qualquer tela (banner ou Conta). */
const openers = new Set<() => void>();
export const onOpenTrackingPreferences = (listener: () => void) => {
  openers.add(listener);
  return () => {
    openers.delete(listener);
  };
};
export const openTrackingPreferences = () => openers.forEach((l) => l());
