import { useState } from "react";

/** Estado comum de formulário: enviando, erro e aviso de sucesso. */
export function useSubmit() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const run = async (action: () => Promise<void>) => {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await action();
    } finally {
      setPending(false);
    }
  };
  return { pending, error, setError, notice, setNotice, run };
}
