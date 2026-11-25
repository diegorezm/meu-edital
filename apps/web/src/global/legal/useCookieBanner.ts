import { DEFAULT_CHOICES, tracking, type TrackingChoices } from "@platform/tracking";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSession } from "../auth";
import {
  currentPrivacyVersion,
  onOpenTrackingPreferences,
  saveTrackingChoices,
  syncTrackingChoices,
} from "./trackingConsent";

/** Estado do banner e das preferências de cookies. */
export function useCookieBanner() {
  const saved = useSyncExternalStore(tracking.subscribe, tracking.saved);
  const session = useSession();
  const signedIn = Boolean(session.data?.user);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TrackingChoices>(DEFAULT_CHOICES);

  const { data: version = null } = useQuery({
    queryKey: ["legal", "privacidade-versao"],
    queryFn: currentPrivacyVersion,
    staleTime: 10 * 60_000,
    retry: false,
  });

  useQuery({
    queryKey: ["legal", "tracking-sync", signedIn],
    queryFn: async () => {
      await syncTrackingChoices();
      return true;
    },
    enabled: signedIn,
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(
    () =>
      onOpenTrackingPreferences(() => {
        setDraft(tracking.saved()?.choices ?? DEFAULT_CHOICES);
        setEditing(true);
      }),
    [],
  );

  // O banner volta quando a política muda depois da última escolha.
  const visible = version !== null && (!saved || saved.policyVersion < version) && !editing;

  const decide = async (choices: TrackingChoices) => {
    setEditing(false);
    await saveTrackingChoices(choices, signedIn);
  };

  return {
    visible,
    editing,
    draft,
    setDraft,
    acceptAll: () => decide({ erros: true, analise: true }),
    rejectAll: () => decide({ erros: false, analise: false }),
    customize: () => {
      setDraft(saved?.choices ?? DEFAULT_CHOICES);
      setEditing(true);
    },
    saveDraft: () => decide(draft),
    close: () => setEditing(false),
  };
}
