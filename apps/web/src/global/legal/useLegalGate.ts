import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptLegal,
  onConsentRequired,
  type PendingDocument,
  pendingLegal,
  takeSignupAcceptance,
} from "./legal";

/** O que falta aceitar; registra o aceite do cadastro quando ele bate com o vigente. */
export function useLegalGate(onAccepted: () => void) {
  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const accepted = useRef(onAccepted);
  useEffect(() => {
    accepted.current = onAccepted;
  });

  const check = useCallback(async () => {
    let list = await pendingLegal().catch(() => []);
    const fromSignup = takeSignupAcceptance();
    const matches =
      fromSignup &&
      list.length > 0 &&
      list.every((p) => fromSignup.some((a) => a.document === p.document && a.version === p.version));
    if (matches) {
      await acceptLegal(list.map(({ document, version }) => ({ document, version })))
        .then(() => {
          list = [];
          accepted.current();
        })
        .catch(() => undefined);
    }
    setPending(list);
  }, []);

  useEffect(() => {
    void check();
    return onConsentRequired(() => void check());
  }, [check]);

  const accept = async () => {
    setBusy(true);
    setError("");
    try {
      await acceptLegal(pending.map(({ document, version }) => ({ document, version })));
      setPending([]);
      accepted.current();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu certo agora. Tente de novo.");
      void check();
    } finally {
      setBusy(false);
    }
  };

  return { pending, accept, busy, error };
}
