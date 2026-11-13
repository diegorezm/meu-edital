import { sendJson } from "@global/api";
import { useState } from "react";
import { useAuthConfig } from "./useAuthConfig";
import { useSubmit } from "./useSubmit";

/** Lista de espera enquanto o cadastro está fechado. */
export function useWaitlist() {
  const { turnstileSiteKey } = useAuthConfig();
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [done, setDone] = useState(false);
  const form = useSubmit();

  const submit = () =>
    form.run(async () => {
      if (turnstileSiteKey && !captchaToken) return form.setError("Confirme que você não é um robô.");
      try {
        await sendJson(
          "/lista-de-espera",
          "POST",
          { email: email.trim(), source: "app" },
          captchaToken ? { "x-captcha-response": captchaToken } : {},
        );
        setDone(true);
      } catch (error) {
        form.setError((error as Error).message);
      }
    });

  return { email, setEmail, turnstileSiteKey, setCaptchaToken, done, submit, ...form };
}
