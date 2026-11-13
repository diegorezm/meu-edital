import { getJson } from "@global/api";
import { openTrackingPreferences } from "@global/legal/trackingConsent";
import type { LegalDocument } from "@global/legal/legal";
import { useQuery } from "@tanstack/react-query";

type Acceptance = { document: LegalDocument; version: string; acceptedAt: number };

/** Versões aceitas dos termos e da privacidade, e o atalho para os cookies. */
export function usePrivacy() {
  const { data } = useQuery({
    queryKey: ["legal", "aceite"],
    queryFn: () => getJson<{ history: Acceptance[] }>("/legal/aceite"),
  });
  const history = data?.history ?? [];
  const latest = (document: LegalDocument) => history.filter((h) => h.document === document).at(-1);
  return { latest, openCookies: openTrackingPreferences };
}
