import { authClient, authErrorMessage, signOut as endSession, useSession } from "@global/auth";
import { clearCachedSessionUser } from "@global/guards";
import { saveSessionToken } from "@global/http";
import { queryClient } from "@global/query";
import { syncLabel, useSyncState } from "@global/store/useStore";
import { timerStore } from "@global/timer/timerStore";
import { platform } from "@platform/index";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSubmit } from "./useSubmit";

export function useAccount() {
  const navigate = useNavigate();
  const session = useSession();
  const sync = useSyncState();
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
      timerStore.set(null);
      clearCachedSessionUser();
      await saveSessionToken(null);
      if (userId) await platform.clearSyncStorage(userId);
      queryClient.clear();
      await navigate({ to: "/entrar", search: { aviso: "conta-excluida" } });
    });

  return {
    user: session.data?.user,
    loading: session.isPending,
    syncStatus: syncLabel(sync),
    confirmingDelete,
    setConfirmingDelete,
    password,
    setPassword,
    signOut,
    deleteAccount,
    ...form,
  };
}
