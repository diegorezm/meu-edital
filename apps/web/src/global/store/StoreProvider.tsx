import type { AppData } from "@meu-edital/domain";
import { SyncClient, type SyncState } from "@meu-edital/sync/client";
import { platform } from "@platform/index";
import { AppSkeleton } from "../components/AppSkeleton";
import { createContext, type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { httpTransport, listenForChanges } from "./transport";

/** Intervalo de segurança, só quando o aviso do servidor está desligado. */
const SYNC_INTERVAL_MS = 60_000;

export const StoreContext = createContext<SyncClient | null>(null);

/**
 * Dados do usuário logado, no TanStack DB. A tela lê e altera na hora; a
 * fila offline envia quando pode, e o cliente busca o que mudou ao abrir, ao
 * voltar a rede ou a aba, com o aviso do servidor e a cada minuto sem aviso.
 */
export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [client, setClient] = useState<SyncClient | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => undefined as void;

    void platform.syncStorage(userId).then(async (local) => {
      if (disposed) return void local.close();
      const instance = new SyncClient({ transport: httpTransport, persist: local.persist, storage: local.storage });
      const sync = () => void instance.sync();
      const online = () => instance.online();
      const onVisible = () => document.visibilityState === "visible" && sync();
      // O aviso da própria alteração volta pelo socket; se o cursor já chegou lá, não busca de novo.
      const live = listenForChanges((notice) => {
        if (notice.version > instance.cursor()) sync();
      });
      const interval = setInterval(() => {
        if (!live.connected()) sync();
      }, SYNC_INTERVAL_MS);
      window.addEventListener("online", online);
      document.addEventListener("visibilitychange", onVisible);
      cleanup = () => {
        live.close();
        clearInterval(interval);
        window.removeEventListener("online", online);
        document.removeEventListener("visibilitychange", onVisible);
        instance.dispose();
        void local.close();
      };
      await instance.start();
      if (disposed) return cleanup();
      setClient(instance);
    });

    return () => {
      disposed = true;
      cleanup();
      setClient(null);
    };
  }, [userId]);

  if (!client) return <AppSkeleton />;
  return <StoreContext.Provider value={client}>{children}</StoreContext.Provider>;
}

export type Store = SyncState & {
  data: AppData;
  update: (change: (data: AppData) => AppData) => AppData;
  syncNow: () => Promise<void>;
  dismissRejected: () => void;
};

export function useClientState(client: SyncClient): SyncState {
  return useSyncExternalStore(client.subscribe, client.getState);
}

export function useClientData(client: SyncClient): AppData {
  return useSyncExternalStore(client.subscribeData, client.data);
}
