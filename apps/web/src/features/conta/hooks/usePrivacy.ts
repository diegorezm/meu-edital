import { getJson } from "@global/api";
import { openTrackingPreferences } from "@global/legal/trackingConsent";
import type { LegalDocument } from "@global/legal/legal";
import { useEffect, useState } from "react";

type Acceptance = { document: LegalDocument; version: string; acceptedAt: number };

/** Versões aceitas dos termos e da privacidade, e o atalho para os cookies. */
export function usePrivacy() {
  const [history, setHistory] = useState<Acceptance[]>([]);
  useEffect(() => {
    getJson<{ history: Acceptance[] }>("/legal/aceite").then(
      (r) => setHistory(r.history),
      () => undefined,
    );
  }, []);
  const latest = (document: LegalDocument) => history.filter((h) => h.document === document).at(-1);
  return { latest, openCookies: openTrackingPreferences };
}
