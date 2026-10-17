import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type AppData, createSeed, emptyData } from "@meu-edital/domain";
import { fromRemote, type SettingsRow, type TableName, tables } from "./remoteSchema";
import { diffData, type SyncOp } from "./sync";

export type SyncStatus = { pending: number; error: string | null };

export interface Repository {
  readonly remote: boolean;
  /** Carrega os dados disponíveis no aparelho (cache ou dados locais). */
  load(): Promise<AppData>;
  save(prev: AppData, next: AppData): Promise<void>;
  /**
   * Envia as alterações pendentes e, se não restar nenhuma, devolve o estado
   * atual do servidor. Devolve `data: null` quando não há estado novo.
   */
  sync(): Promise<SyncResult>;
}

export type SyncResult = { data: AppData | null; status: SyncStatus };

const LOCAL_KEY = "@meu-edital:data:v2";
const idle: SyncStatus = { pending: 0, error: null };

/** Modo sem conta: os dados ficam só neste aparelho. */
export const localRepository: Repository = {
  remote: false,
  async load() {
    const stored = await AsyncStorage.getItem(LOCAL_KEY);
    if (!stored) {
      const seed = createSeed();
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed: AppData = JSON.parse(stored);
    if (parsed.version !== 2)
      throw new Error("Versão dos dados locais incompatível.");
    return parsed;
  },
  async save(_prev, next) {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  },
  async sync() {
    return { data: null, status: idle };
  },
};

class OfflineError extends Error {}

async function fetchAll(client: SupabaseClient, table: (typeof tables)[number]) {
  const rows: unknown[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await client
      .from(table.name)
      .select("*")
      .order(table.order.column, { ascending: table.order.ascending })
      .order("id", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw toSyncError(error);
    rows.push(...data);
    if (data.length < page) return rows;
  }
}

function toSyncError(error: { message: string; code?: string }) {
  // Falhas de rede chegam sem código do PostgREST.
  return error.code ? new Error(error.message) : new OfflineError(error.message);
}

async function runOp(client: SupabaseClient, op: SyncOp) {
  const result =
    op.kind === "upsert"
      ? await client.from(op.table).upsert(op.rows, { onConflict: "id" })
      : op.kind === "delete"
        ? await client.from(op.table).delete().in("id", op.ids)
        : await client
            .from("user_settings")
            .upsert(op.row, { onConflict: "user_id" });
  if (result.error) throw toSyncError(result.error);
}

/**
 * Modo com conta: o Supabase é a fonte da verdade. O aparelho guarda uma
 * cópia para abrir rápido e uma fila de alterações que é enviada quando há
 * conexão, para que o estudo possa ser registrado offline.
 */
export function createRemoteRepository(
  client: SupabaseClient,
  userId: string,
): Repository {
  const cacheKey = `@meu-edital:cache:v2:${userId}`;
  const outboxKey = `@meu-edital:outbox:v1:${userId}`;
  let outbox: SyncOp[] | null = null;
  let running: Promise<SyncResult> | null = null;
  let queued: Promise<SyncResult> | null = null;

  const readOutbox = async () => {
    if (!outbox) {
      const stored = await AsyncStorage.getItem(outboxKey);
      outbox = stored ? JSON.parse(stored) : [];
    }
    return outbox!;
  };
  const writeOutbox = (ops: SyncOp[]) => {
    outbox = ops;
    return AsyncStorage.setItem(outboxKey, JSON.stringify(ops));
  };

  const flushAndFetch = async (): Promise<SyncResult> => {
    let error: string | null = null;
    try {
      while ((await readOutbox()).length) {
        const op = outbox![0];
        try {
          await runOp(client, op);
        } catch (cause) {
          if (cause instanceof OfflineError) throw cause;
          // O servidor recusou a alteração: descarta para não travar a fila.
          error = `Uma alteração não foi aceita pelo servidor: ${(cause as Error).message}`;
        }
        // Lê de novo: novas alterações podem ter entrado durante o envio.
        await writeOutbox(outbox!.slice(1));
      }
      const rows = {} as Record<TableName, unknown[]>;
      for (const table of tables) rows[table.name] = await fetchAll(client, table);
      const settings = await client
        .from("user_settings")
        .select("*")
        .maybeSingle<SettingsRow>();
      if (settings.error) throw toSyncError(settings.error);
      if ((await readOutbox()).length)
        return { data: null, status: { pending: outbox!.length, error } };
      const data = fromRemote(rows as Record<TableName, any[]>, settings.data);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      return { data, status: { pending: 0, error } };
    } catch (cause) {
      return {
        data: null,
        status: {
          pending: (await readOutbox()).length,
          error:
            cause instanceof OfflineError
              ? "Sem conexão. Suas alterações serão enviadas quando a internet voltar."
              : (cause as Error).message,
        },
      };
    }
  };

  return {
    remote: true,
    async load() {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached) as AppData;
      const { data, status } = await sync();
      if (data) return data;
      if (status.error) throw new Error(status.error);
      return emptyData();
    },
    async save(prev, next) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(next));
      const ops = diffData(prev, next, userId);
      if (ops.length) await writeOutbox([...(await readOutbox()), ...ops]);
    },
    sync,
  };

  // Uma sincronização por vez; pedidos feitos durante uma delas viram uma única rodada seguinte.
  function sync(): Promise<SyncResult> {
    if (!running) {
      running = flushAndFetch().finally(() => {
        running = null;
      });
      return running;
    }
    queued ||= running.then(() => {
      queued = null;
      return sync();
    });
    return queued;
  }
}
