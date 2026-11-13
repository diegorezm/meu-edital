import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptLegal,
  onConsentRequired,
  type PendingDocument,
  pendingLegal,
  clearSignupAcceptance,
  peekSignupAcceptance,
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

  // Uma verificação por vez: a montagem e o 409 do sync podem disparar juntas,
  // e a segunda não pode mostrar o diálogo enquanto a primeira registra o aceite.
  const inflight = useRef<Promise<void> | null>(null);
  const check = useCallback(() => {
    const run = async () => {
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
      setPending(list);
    };
    inflight.current ??= run().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
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
