import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  acceptLegal,
  clearSignupAcceptance,
  onConsentRequired,
  peekSignupAcceptance,
  type PendingDocument,
  pendingLegal,
} from "./legal";

const PENDING_KEY = ["legal", "pendentes"] as const;

/** O que falta aceitar; registra o aceite do cadastro quando ele bate com o vigente. */
export function useLegalGate(onAccepted: () => void) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const accepted = useRef(onAccepted);
  useEffect(() => {
    accepted.current = onAccepted;
  });

  const query = useQuery<PendingDocument[]>({
    queryKey: PENDING_KEY,
    queryFn: async () => {
      let list = await pendingLegal().catch(() => []);
      const fromSignup = peekSignupAcceptance();
      const matches =
        fromSignup &&
        list.length > 0 &&
        list.every((p) => fromSignup.some((a) => a.document === p.document && a.version === p.version));
      if (matches) {
        await acceptLegal(list.map(({ document, version }) => ({ document, version })))
          .then(() => {
            clearSignupAcceptance();
            list = [];
            accepted.current();
          })
          .catch(() => undefined);
      }
      return list;
    },
    staleTime: 60_000,
    retry: false,
  });

  useEffect(
    () =>
      onConsentRequired(() => {
        void queryClient.invalidateQueries({ queryKey: PENDING_KEY });
      }),
    [queryClient],
  );

  const pending = query.data ?? [];

  const accept = async () => {
    setBusy(true);
    setError("");
    try {
      await acceptLegal(pending.map(({ document, version }) => ({ document, version })));
      queryClient.setQueryData<PendingDocument[]>(PENDING_KEY, []);
      accepted.current();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu certo agora. Tente de novo.");
      void queryClient.invalidateQueries({ queryKey: PENDING_KEY });
    } finally {
      setBusy(false);
    }
  };

  return { pending, accept, busy, error };
}
