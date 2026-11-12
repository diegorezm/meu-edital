import { authClient, authErrorMessage } from "@global/auth";
import { useSubmit } from "./useSubmit";

export function useResendVerification(email: string | undefined) {
  const form = useSubmit();
  const resend = () =>
    form.run(async () => {
      if (!email) return;
      const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/" });
      if (error) return form.setError(authErrorMessage(error));
      form.setNotice("Mandamos outro link. Confira também a caixa de spam.");
    });
  return { email, resend, ...form };
}
