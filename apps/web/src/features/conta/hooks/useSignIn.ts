import { authClient, authErrorMessage } from "@global/auth";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthConfig } from "./useAuthConfig";
import { useSubmit } from "./useSubmit";

export function useSignIn() {
  const navigate = useNavigate();
  const { googleEnabled } = useAuthConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const form = useSubmit();

  const submit = () =>
    form.run(async () => {
      const { error } = await authClient.signIn.email({ email: email.trim(), password });
      if (error) return form.setError(authErrorMessage(error));
      await navigate({ to: "/" });
    });

  const signInWithGoogle = () =>
    form.run(async () => {
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (error) form.setError(authErrorMessage(error));
    });

  return { email, setEmail, password, setPassword, googleEnabled, submit, signInWithGoogle, ...form };
}
