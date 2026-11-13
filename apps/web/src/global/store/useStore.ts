import type { SyncClient, SyncCollections } from "@meu-edital/sync/client";
import { useContext, useMemo } from "react";
import { type Store, StoreContext, useClientData, useClientState } from "./StoreProvider";

function useClient(): SyncClient {
  const client = useContext(StoreContext);
  if (!client) throw new Error("useStore precisa estar dentro de StoreProvider.");
  return client;
}

/**
 * Estado e ações dos dados de estudo. Altere sempre com funções de domínio:
 * `update((data) => recordSession(data, ...))`. Renderiza a cada mudança em
 * qualquer tabela; para ler só algumas linhas, use `useCollections()` com
 * `useLiveQuery`.
 */
export function useStore(): Store {
  const client = useClient();
  const state = useClientState(client);
  const data = useClientData(client);
  return useMemo(
    () => ({
      ...state,
      data,
      update: (change) => client.update(change),
      syncNow: () => client.sync(),
      dismissRejected: () => client.dismissRejected(),
    }),
    [state, data, client],
  );
}

/** Ações sem leitura: não renderiza quando os dados mudam. */
export function useStoreActions() {
  const client = useClient();
  return useMemo(
    () => ({
      update: (change: Parameters<SyncClient["update"]>[0]) => client.update(change),
      syncNow: () => client.sync(),
    }),
    [client],
  );
}

/** As coleções do TanStack DB, para `useLiveQuery` com só as linhas que a tela usa. */
export function useCollections(): SyncCollections {
  return useClient().collections;
}

/** Texto curto do estado do sync, para a barra do app. */
export function syncLabel(store: Pick<Store, "status" | "pending">): string {
  const { pending } = store;
  if (store.status === "syncing") return "Sincronizando...";
  if (store.status === "offline")
    return pending ? `Offline · ${pending} alteraç${pending === 1 ? "ão" : "ões"} na fila` : "Offline";
  if (store.status === "error") return "Não deu para sincronizar agora";
  return pending ? "Salvando..." : "Tudo salvo";
}
