/**
 * Documentos legais e suas versões, da mais antiga para a mais nova. A
 * versão é a data de publicação (`AAAA-MM-DD`), então comparar texto basta.
 * Os textos ficam em `docs/legal/`.
 *
 * Para publicar uma versão: acrescente-a aqui. Com `material: true`, quem
 * aceitou uma versão anterior precisa aceitar de novo para continuar usando
 * o app; sem isso, a mudança só aparece como aviso.
 */
export const LEGAL_DOCUMENTS = {
  termos: [
    { version: "2026-11-13", material: true, summary: "Primeira versão dos Termos de Uso." },
  ],
  privacidade: [
    {
      version: "2026-11-13",
      material: true,
      summary: "Primeira versão da Política de Privacidade.",
    },
  ],
} as const satisfies Record<string, readonly LegalVersion[]>;

export type LegalVersion = { version: string; material: boolean; summary: string };
export type LegalDocument = keyof typeof LEGAL_DOCUMENTS;
export const LEGAL_DOCUMENT_NAMES = Object.keys(LEGAL_DOCUMENTS) as LegalDocument[];

const versionsOf = (document: LegalDocument): readonly LegalVersion[] => LEGAL_DOCUMENTS[document];

/** A versão em vigor. */
export const currentVersion = (document: LegalDocument) => versionsOf(document).at(-1)!;

/** A versão material mais recente: aceitar ela (ou uma posterior) basta. */
export const requiredVersion = (document: LegalDocument) =>
  [...versionsOf(document)].reverse().find((v) => v.material)?.version ?? currentVersion(document).version;

export type PendingDocument = {
  document: LegalDocument;
  version: string;
  /** O que mudou desde a última versão aceita, da mais antiga para a mais nova. */
  changes: string[];
  /** Nunca aceitou nenhuma versão (primeiro aceite). */
  first: boolean;
};

/**
 * O que a pessoa precisa aceitar, a partir da última versão aceita de cada
 * documento. Só entram os documentos com mudança material pendente.
 */
export function pendingDocuments(accepted: Partial<Record<LegalDocument, string>>): PendingDocument[] {
  return LEGAL_DOCUMENT_NAMES.flatMap((document) => {
    const last = accepted[document];
    if (last && last >= requiredVersion(document)) return [];
    const changes = versionsOf(document)
      .filter((v) => !last || v.version > last)
      .map((v) => v.summary);
    return [{ document, version: currentVersion(document).version, changes, first: !last }];
  });
}
