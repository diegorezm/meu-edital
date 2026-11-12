import { type LocalStore, memoryStore, type Snapshot } from "@meu-edital/sync";

const DB_NAME = "meu-edital";
const STORE = "snapshots";

let opening: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  return (opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
      }),
  );
}

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
        return ((await run("readonly", (s) => s.get(name))) as Snapshot | undefined) ?? null;
      } catch {
        broken = true;
        return fallback.load();
      }
    },
    async save(snapshot) {
      if (broken) return fallback.save(snapshot);
      try {
        await run("readwrite", (s) => s.put(snapshot, name));
      } catch {
        broken = true;
        await fallback.save(snapshot);
      }
    },
  };
}

export async function clearIndexedDbStore(name: string) {
  if (typeof indexedDB === "undefined") return;
  await run("readwrite", (s) => s.delete(name)).catch(() => undefined);
}
