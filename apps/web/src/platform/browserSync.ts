import type { CollectionOptions } from "@meu-edital/sync/client";
import {
  BrowserCollectionCoordinator,
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
  persistedCollectionOptions,
} from "@tanstack/browser-db-sqlite-persistence";
import { IndexedDBAdapter } from "@tanstack/offline-transactions";
import type { SyncStorage } from "./types";

const dataName = (userId: string) => `dados-${userId}`;
const queueName = (userId: string) => `fila-${userId}`;

/**
 * Dados do usuário no SQLite do navegador (OPFS), linha por linha, e a fila
 * de alterações no IndexedDB. Várias abas dividem o mesmo banco pelo
 * coordenador. Sem OPFS (janela anônima em alguns navegadores), os dados
 * ficam só em memória: o app funciona, mas não abre offline.
 */
export async function browserSyncStorage(userId: string): Promise<SyncStorage> {
  const storage = new IndexedDBAdapter(queueName(userId), "transacoes");
  try {
    const database = await openBrowserWASQLiteOPFSDatabase({ databaseName: `${dataName(userId)}.sqlite` });
    const coordinator = new BrowserCollectionCoordinator({ dbName: dataName(userId) });
    const persistence = createBrowserWASQLitePersistence({ database, coordinator });
    return {
      storage,
      persist: (options) =>
        persistedCollectionOptions({
          ...options,
          persistence,
          schemaVersion: 1,
          initialRender: { strategy: "network-first", networkTimeoutMs: 0 },
        }) as unknown as CollectionOptions,
      async close() {
        coordinator.dispose();
        await database.close?.();
      },
    };
  } catch {
    return { storage, close: async () => undefined };
  }
}

/** Apaga os dados e a fila do usuário (ao excluir a conta). */
export async function clearBrowserSyncStorage(userId: string) {
  try {
    const root = await navigator.storage.getDirectory();
    for await (const name of (root as unknown as { keys(): AsyncIterable<string> }).keys())
      if (name.startsWith(dataName(userId))) await root.removeEntry(name, { recursive: true });
  } catch {
    // Sem OPFS: não havia nada salvo.
  }
  if (typeof indexedDB !== "undefined") indexedDB.deleteDatabase(queueName(userId));
}
