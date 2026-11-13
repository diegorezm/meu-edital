import { useState } from "react";

export type ConsentSearch = { handle?: string; cliente?: string; destino?: string; escopos?: string };

/** Consentimento de uma IA que quer se conectar ao Oráculo. */
export function useConsent(search: ConsentSearch) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const scopes = (search.escopos ?? "").split(" ").filter(Boolean);

  const decide = async (decision: "permitir" | "recusar") => {
    if (!search.handle) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/oauth/consent", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: search.handle, decision }),
      });
      const body = (await response.json().catch(() => ({}))) as { redirectTo?: string; error?: string };
      if (!response.ok || !body.redirectTo) throw new Error(body.error ?? "Não deu certo. Volte para a IA e tente de novo.");
      // A volta é para o endereço da IA, fora do app.
      window.location.assign(body.redirectTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu certo.");
      setPending(false);
    }
  };

  return {
    valid: Boolean(search.handle),
    client: search.cliente ?? "Uma IA",
    destination: search.destino,
    canRead: scopes.includes("estudo:ler"),
    canPropose: scopes.includes("estudo:propor"),
    pending,
    error,
    allow: () => decide("permitir"),
    deny: () => decide("recusar"),
  };
}
