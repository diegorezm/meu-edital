import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from "@capacitor-community/sqlite";
import type { CollectionOptions } from "@meu-edital/sync/client";
import {
  createCapacitorSQLitePersistence,
  persistedCollectionOptions,
} from "@tanstack/capacitor-db-sqlite-persistence";
import type { StorageAdapter } from "@tanstack/offline-transactions";
import type { SyncStorage } from "./types";

const dataName = (userId: string) => `dados-${userId}`;
const queueName = (userId: string) => `fila-${userId}`;

let sqlite: SQLiteConnection | undefined;
const connection = () => (sqlite ??= new SQLiteConnection(CapacitorSQLite));

async function open(name: string): Promise<SQLiteDBConnection> {
  const conn = connection();
  const exists = (await conn.isConnection(name, false)).result;
  const db = exists
    ? await conn.retrieveConnection(name, false)
    : await conn.createConnection(name, false, "no-encryption", 1, false);
  if (!(await db.isDBOpen()).result) await db.open();
  return db;
}

/** Fila de alterações numa tabela chave-valor do SQLite (o sistema pode limpar o WebView). */
async function queueStorage(userId: string): Promise<StorageAdapter> {
  const db = await open(queueName(userId));
  await db.execute("create table if not exists fila (chave text primary key, valor text not null)");
  return {
    async get(key) {
      const result = await db.query("select valor from fila where chave = ?", [key]);
      return (result.values?.[0]?.valor as string | undefined) ?? null;
    },
    async set(key, value) {
      await db.run(
        "insert into fila (chave, valor) values (?, ?) on conflict(chave) do update set valor = excluded.valor",
        [key, value],
      );
    },
    async delete(key) {
      await db.run("delete from fila where chave = ?", [key]);
    },
    async keys() {
      const result = await db.query("select chave from fila");
      return (result.values ?? []).map((row) => row.chave as string);
    },
    async clear() {
      await db.run("delete from fila");
    },
  };
}

/** Dados do usuário no SQLite do aparelho, linha por linha, e a fila ao lado. */
export async function nativeSyncStorage(userId: string): Promise<SyncStorage> {
  try {
    const [database, storage] = await Promise.all([open(dataName(userId)), queueStorage(userId)]);
    const persistence = createCapacitorSQLitePersistence({ database });
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
        await connection().closeAllConnections().catch(() => undefined);
      },
    };
  } catch {
    // SQLite falhou: dados em memória, fila no armazenamento padrão do WebView.
    return { close: async () => undefined };
  }
}

/** Apaga os dados e a fila do usuário (ao excluir a conta). */
export async function clearNativeSyncStorage(userId: string) {
  await connection().closeAllConnections().catch(() => undefined);
  for (const name of [dataName(userId), queueName(userId)])
    await CapacitorSQLite.deleteDatabase({ database: name }).catch(() => undefined);
}
