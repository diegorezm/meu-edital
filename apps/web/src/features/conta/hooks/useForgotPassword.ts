import { authClient, authErrorMessage } from "@global/auth";
import { useState } from "react";
import { useAuthConfig } from "./useAuthConfig";
import { useSubmit } from "./useSubmit";

export function useForgotPassword() {
  const { turnstileSiteKey, emailEnabled } = useAuthConfig();
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [sent, setSent] = useState(false);
  const form = useSubmit();

  const submit = () =>
    form.run(async () => {
      if (turnstileSiteKey && !captchaToken)
        return form.setError("Confirme que você não é um robô.");
      const { error } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/redefinir-senha",
        fetchOptions: captchaToken ? { headers: { "x-captcha-response": captchaToken } } : {},
      });
      if (error) return form.setError(authErrorMessage(error));
      setSent(true);
    });

  return { emailEnabled, email, setEmail, sent, turnstileSiteKey, setCaptchaToken, submit, ...form };
}
