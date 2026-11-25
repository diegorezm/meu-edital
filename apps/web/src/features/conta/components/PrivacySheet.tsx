import { Button, Notice, Sheet, textLinkClass } from "@meu-edital/ui";
import { downloadExport } from "@global/exportDownload";
import { LEGAL_PATHS, LEGAL_TITLES, type LegalDocument } from "@global/legal/legal";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { usePrivacy } from "../hooks/usePrivacy";

const formatDate = (version: string) => version.split("-").reverse().join("/");

/** Privacidade: exportar os dados, cookies e as versões aceitas. */
export function PrivacySheet({ privacy }: { privacy: ReturnType<typeof usePrivacy> }) {
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [exportError, setExportError] = useState("");
  const runExport = async (format: "json" | "csv") => {
    setExporting(format);
    setExportError("");
    try {
      await downloadExport(format);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Não deu para baixar seus dados.");
    } finally {
      setExporting(null);
    }
  };
  return (
    <Sheet title="Privacidade" tone="gold" ribbonSize="sm" className="pt-[26px]">
      <p className="mb-3 text-sm">Leve seu estudo para onde quiser: tudo em JSON ou as sessões numa planilha.</p>
      {exportError && (
        <div className="mb-3">
          <Notice tone="error">{exportError}</Notice>
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="quiet" disabled={exporting !== null} onClick={() => void runExport("json")}>
          Baixar tudo (JSON)
        </Button>
        <Button variant="quiet" disabled={exporting !== null} onClick={() => void runExport("csv")}>
          Baixar sessões (CSV)
        </Button>
      </div>
      <Button variant="quiet" onClick={privacy.openCookies}>
        Preferências de cookies
      </Button>
      <ul className="mt-4 grid gap-1 text-sm">
        {(Object.keys(LEGAL_TITLES) as LegalDocument[]).map((document) => {
          const accepted = privacy.latest(document);
          return (
            <li key={document}>
              <Link to={LEGAL_PATHS[document]} className={textLinkClass}>
                {LEGAL_TITLES[document]}
              </Link>
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
