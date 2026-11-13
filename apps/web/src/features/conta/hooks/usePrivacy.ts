import { openTrackingPreferences } from "@global/legal/trackingConsent";
import { acceptanceQuery, type LegalDocument } from "@global/legal/legal";
import { useQuery } from "@tanstack/react-query";

/** Versões aceitas dos termos e da privacidade, e o atalho para os cookies. */
export function usePrivacy() {
  const { data } = useQuery(acceptanceQuery);
  const history = data?.history ?? [];
  const latest = (document: LegalDocument) => history.filter((h) => h.document === document).at(-1);
  return { latest, openCookies: openTrackingPreferences };
}
