import type { StorageAdapter } from "@tanstack/offline-transactions";

/** Fila offline em memória: testes e navegadores sem armazenamento. */
export function memoryStorage(): StorageAdapter {
  const items = new Map<string, string>();
  return {
    get: async (key) => items.get(key) ?? null,
    set: async (key, value) => {
      items.set(key, value);
    },
    delete: async (key) => {
      items.delete(key);
    },
    keys: async () => [...items.keys()],
    clear: async () => items.clear(),
  };
}
