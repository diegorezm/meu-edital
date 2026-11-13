import { Button, buttonClass, Sheet, textLinkClass } from "@meu-edital/ui";
import { apiUrl } from "@global/http";
import { LEGAL_PATHS, LEGAL_TITLES, type LegalDocument } from "@global/legal/legal";
import type { usePrivacy } from "../hooks/usePrivacy";

const formatDate = (version: string) => version.split("-").reverse().join("/");

/** Privacidade: exportar os dados, cookies e as versões aceitas. */
export function PrivacySheet({ privacy }: { privacy: ReturnType<typeof usePrivacy> }) {
  return (
    <Sheet title="Privacidade" tone="gold" ribbonSize="sm" className="pt-[26px]">
      <p className="mb-3 text-sm">Leve seu estudo para onde quiser: tudo em JSON ou as sessões numa planilha.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <a href={apiUrl("/api/export?formato=json")} download className={buttonClass("quiet")}>
          Baixar tudo (JSON)
        </a>
        <a href={apiUrl("/api/export?formato=csv")} download className={buttonClass("quiet")}>
          Baixar sessões (CSV)
        </a>
      </div>
      <Button variant="quiet" onClick={privacy.openCookies}>
        Preferências de cookies
      </Button>
      <ul className="mt-4 grid gap-1 text-sm">
        {(Object.keys(LEGAL_TITLES) as LegalDocument[]).map((document) => {
          const accepted = privacy.latest(document);
          return (
            <li key={document}>
              <a href={LEGAL_PATHS[document]} className={textLinkClass}>
                {LEGAL_TITLES[document]}
              </a>
              {accepted && (
                <span className="text-ink-muted"> · versão de {formatDate(accepted.version)} aceita</span>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
