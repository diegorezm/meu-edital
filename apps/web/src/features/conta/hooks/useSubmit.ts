import { useRef, useState } from "react";

/** Estado comum de formulário: enviando, erro e aviso de sucesso. */
export function useSubmit() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const running = useRef(false);
  const run = async (action: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não deu certo agora. Tente de novo.");
    } finally {
      running.current = false;
      setPending(false);
    }
  };
  return { pending, error, setError, notice, setNotice, run };
}
