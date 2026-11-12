import { authClient, authErrorMessage } from "@global/auth";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSubmit } from "./useSubmit";

export function useResetPassword(token: string | undefined, linkError: string | undefined) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const form = useSubmit();
  const invalidLink = !token || Boolean(linkError);

  const submit = () =>
    form.run(async () => {
      if (password.length < 8) return form.setError("A senha precisa de pelo menos 8 caracteres.");
      if (password !== confirm) return form.setError("As duas senhas não são iguais.");
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
      if (error) return form.setError(authErrorMessage(error));
      await navigate({ to: "/entrar", search: { aviso: "senha-trocada" } });
    });

  return { password, setPassword, confirm, setConfirm, invalidLink, submit, ...form };
}
