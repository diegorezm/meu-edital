import { authClient, authErrorMessage } from "@global/auth";
import { rememberSignupAcceptance } from "@global/legal/legal";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthConfig } from "./useAuthConfig";
import { useSubmit } from "./useSubmit";

export function useSignUp() {
  const navigate = useNavigate();
  const { turnstileSiteKey, googleEnabled } = useAuthConfig();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [accepted, setAccepted] = useState(false);
  const form = useSubmit();

  const submit = () =>
    form.run(async () => {
      if (password.length < 8) return form.setError("A senha precisa de pelo menos 8 caracteres.");
      if (!accepted) return form.setError("Aceite os termos para criar a conta.");
      if (turnstileSiteKey && !captchaToken)
        return form.setError("Confirme que você não é um robô.");
      const { data, error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        callbackURL: "/",
        fetchOptions: captchaToken ? { headers: { "x-captcha-response": captchaToken } } : {},
      });
      if (error) return form.setError(authErrorMessage(error));
      await rememberSignupAcceptance();
      // Sem confirmação de e-mail, o cadastro já devolve a sessão.
      if (data?.token) await navigate({ to: "/" });
      else await navigate({ to: "/verifique-seu-email", search: { email: email.trim() } });
    });

  const signUpWithGoogle = () =>
    form.run(async () => {
      if (!accepted) return form.setError("Aceite os termos para criar a conta.");
      await rememberSignupAcceptance();
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (error) form.setError(authErrorMessage(error));
    });

  return {
    signUpWithGoogle,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    accepted,
    setAccepted,
    turnstileSiteKey,
    setCaptchaToken,
    googleEnabled,
    submit,
    ...form,
  };
}
