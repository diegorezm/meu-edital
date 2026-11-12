import { useContext, useMemo } from "react";
import { type Store, StoreContext, useEngineState } from "./StoreProvider";

/**
 * Estado e ações dos dados de estudo. Altere sempre com funções de domínio:
 * `update((data) => recordSession(data, ...))`.
 */
export function useStore(): Store {
  const engine = useContext(StoreContext);
  if (!engine) throw new Error("useStore precisa estar dentro de StoreProvider.");
  const state = useEngineState(engine);
  return useMemo(
    () => ({
      ...state,
      update: (change) => engine.update(change),
      syncNow: () => engine.sync(),
      dismissRejected: () => engine.dismissRejected(),
    }),
    [state, engine],
  );
}

/** Texto curto do estado do sync, para a barra do app. */
export function syncLabel(store: Pick<Store, "status" | "outbox">): string {
  const pending = store.outbox.length;
  if (store.status === "syncing") return "Sincronizando...";
  if (store.status === "offline")
    return pending ? `Offline · ${pending} alteraç${pending === 1 ? "ão" : "ões"} na fila` : "Offline";
  if (store.status === "error") return "Não deu para sincronizar agora";
  return pending ? "Salvando..." : "Tudo salvo";
}
