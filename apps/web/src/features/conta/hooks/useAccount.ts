import { authClient, authErrorMessage, signOut as endSession, useSession } from "@global/auth";
import { queryClient } from "@global/query";
import { storeName } from "@global/store/StoreProvider";
import { syncLabel, useStore } from "@global/store/useStore";
import { platform } from "@platform/index";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSubmit } from "./useSubmit";

export function useAccount() {
  const navigate = useNavigate();
  const session = useSession();
  const store = useStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [password, setPassword] = useState("");
  const form = useSubmit();

  const signOut = () =>
    form.run(async () => {
      await endSession();
      await navigate({ to: "/entrar" });
    });

  const deleteAccount = () =>
    form.run(async () => {
      const userId = session.data?.user.id;
      const { error } = await authClient.deleteUser(password ? { password } : {});
      if (error) return form.setError(authErrorMessage(error));
      if (userId) await platform.clearLocalStore(storeName(userId));
      queryClient.clear();
      await navigate({ to: "/entrar", search: { aviso: "conta-excluida" } });
    });

  return {
    user: session.data?.user,
    loading: session.isPending,
    syncStatus: syncLabel(store),
    confirmingDelete,
    setConfirmingDelete,
    password,
    setPassword,
    signOut,
    deleteAccount,
    ...form,
  };
}
