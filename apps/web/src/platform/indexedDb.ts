import { type LocalStore, memoryStore, type Snapshot } from "@meu-edital/sync";
import { createStore, del, get, set } from "idb-keyval";

let db: ReturnType<typeof createStore> | undefined;
const snapshots = () => (db ??= createStore("meu-edital", "snapshots"));

/**
 * Banco local no IndexedDB. Se o navegador bloquear (janela anônima em
 * alguns navegadores), cai para memória: o app funciona, mas não offline.
 */
export function indexedDbStore(name: string): LocalStore {
  const fallback = memoryStore();
  let broken = typeof indexedDB === "undefined";
  return {
    async load() {
      if (broken) return fallback.load();
      try {
        return (await get<Snapshot>(name, snapshots())) ?? null;
      } catch {
        broken = true;
        return fallback.load();
      }
    },
    async save(snapshot) {
      if (broken) return fallback.save(snapshot);
      try {
        await set(name, snapshot, snapshots());
      } catch {
        broken = true;
        await fallback.save(snapshot);
      }
    },
  };
}

export async function clearIndexedDbStore(name: string) {
  if (typeof indexedDB === "undefined") return;
  await del(name, snapshots()).catch(() => undefined);
}
