import { authClient, authErrorMessage, useSession } from "@global/auth";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSubmit } from "./useSubmit";

export function useAccount() {
  const navigate = useNavigate();
  const session = useSession();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [password, setPassword] = useState("");
  const form = useSubmit();

  const signOut = () =>
    form.run(async () => {
      await authClient.signOut();
      await navigate({ to: "/entrar" });
    });

  const deleteAccount = () =>
    form.run(async () => {
      const { error } = await authClient.deleteUser({ password });
      if (error) return form.setError(authErrorMessage(error));
      await navigate({ to: "/entrar", search: { aviso: "conta-excluida" } });
    });

  return {
    user: session.data?.user,
    loading: session.isPending,
    confirmingDelete,
    setConfirmingDelete,
    password,
    setPassword,
    signOut,
    deleteAccount,
    ...form,
  };
}
