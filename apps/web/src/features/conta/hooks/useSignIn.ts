import { authClient, authErrorMessage } from "@global/auth";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthConfig } from "./useAuthConfig";
import { useSubmit } from "./useSubmit";

/** Só aceita voltar para a autorização do Oráculo (nunca para fora do app). */
const safeReturn = (volta?: string) => (volta?.startsWith("/authorize?") ? volta : undefined);

export function useSignIn(volta?: string) {
  const navigate = useNavigate();
  const { googleEnabled } = useAuthConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const form = useSubmit();

  const submit = () =>
    form.run(async () => {
      const { error } = await authClient.signIn.email({ email: email.trim(), password });
      if (error) return form.setError(authErrorMessage(error));
      const back = safeReturn(volta);
      // /authorize é do Worker, não do app: precisa de navegação completa.
      if (back) window.location.assign(back);
      else await navigate({ to: "/" });
    });

  const signInWithGoogle = () =>
    form.run(async () => {
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (error) form.setError(authErrorMessage(error));
    });

  return { email, setEmail, password, setPassword, googleEnabled, submit, signInWithGoogle, ...form };
}
