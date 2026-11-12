import { type AppData, emptyData } from "@meu-edital/domain";
import { SyncEngine, type SyncState } from "@meu-edital/sync";
import { platform } from "@platform/index";
import { createContext, type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { httpTransport, listenForChanges } from "./transport";

export const storeName = (userId: string) => `dados-${userId}`;

/** Intervalo de segurança: sincroniza mesmo sem aviso do servidor. */
const SYNC_INTERVAL_MS = 60_000;
/** Junta alterações seguidas em um envio só. */
const PUSH_DELAY_MS = 800;

export const StoreContext = createContext<SyncEngine | null>(null);

/**
 * Dados do usuário logado. A tela lê e altera o banco local na hora; o
 * motor sincroniza ao abrir, ao voltar a rede ou a aba, com o aviso do
 * servidor, logo depois de cada alteração e a cada minuto.
 */
export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [engine, setEngine] = useState<SyncEngine | null>(null);

  useEffect(() => {
    const instance = new SyncEngine(platform.localStore(storeName(userId)), httpTransport, emptyData);
    let push: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    const sync = () => {
      if (started) void instance.sync();
    };
    const schedulePush = () => {
      clearTimeout(push);
      push = setTimeout(sync, PUSH_DELAY_MS);
    };
    let outbox = instance.getState().outbox;
    const unsubscribe = instance.subscribe((state) => {
      if (state.outbox !== outbox && state.outbox.length && state.status !== "syncing")
        schedulePush();
      outbox = state.outbox;
    });
    const onVisible = () => document.visibilityState === "visible" && sync();
    const live = listenForChanges(sync);
    const interval = setInterval(sync, SYNC_INTERVAL_MS);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", onVisible);

    void instance.start().then(() => {
      started = true;
      setEngine(instance);
      sync();
    });

    return () => {
      unsubscribe();
      live.close();
      clearInterval(interval);
      clearTimeout(push);
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", onVisible);
      void instance.flush();
    };
  }, [userId]);

  if (!engine) return null;
  return <StoreContext.Provider value={engine}>{children}</StoreContext.Provider>;
}

export type Store = SyncState & {
  update: (change: (data: AppData) => AppData) => AppData;
  syncNow: () => Promise<void>;
  dismissRejected: () => void;
};

export function useEngineState(engine: SyncEngine): SyncState {
  return useSyncExternalStore(engine.subscribe, engine.getState);
}
