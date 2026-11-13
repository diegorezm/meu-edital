import type { AppData } from "@meu-edital/domain";
import { type Collection, createCollection, type PendingMutation, type SyncConfig } from "@tanstack/db";
import {
  type LeaderElection,
  NonRetriableError,
  type OfflineExecutor,
  type OnlineDetector,
  type StorageAdapter,
  startOfflineExecutor,
} from "@tanstack/offline-transactions";
import { cleanRow, diffData, orderBatch } from "./diff";
import { MAX_BATCH, type Mutation, OfflineError, type PullResponse, type Rejection, type Transport } from "./protocol";
import { assemble, plain } from "./rows";
import { type Row, TABLES, type TableName } from "./tables";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

/** Mutação recusada pelo servidor, ainda não vista pelo estudante. */
export type RejectedMutation = Rejection & { mutation: Mutation };

export type SyncState = {
  status: SyncStatus;
  /** Os dados locais já carregaram (do aparelho ou da rede). */
  ready: boolean;
  /** Alterações ainda não confirmadas pelo servidor. */
  pending: number;
  rejected: RejectedMutation[];
};

type AnyRow = Row & { id: string };
type Params = Parameters<SyncConfig<AnyRow, string>["sync"]>[0];
export type SyncCollections = { [T in TableName]: Collection<Row<T> & { id: string }, string> };

/** Opções de uma coleção, antes de virar coleção (a persistência envolve isto). */
export type CollectionOptions = {
  id: string;
  getKey: (row: AnyRow) => string;
  sync: SyncConfig<AnyRow, string>;
  startSync: true;
  gcTime: 0;
};

export type SyncClientOptions = {
  transport: Transport;
  /** Envolve as opções de cada coleção, por exemplo com persistência SQLite. */
  persist?: (options: CollectionOptions) => CollectionOptions;
  /** Onde a fila de alterações fica guardada (padrão: IndexedDB do navegador). */
  storage?: StorageAdapter;
  leaderElection?: LeaderElection;
  onlineDetector?: OnlineDetector;
};

const CURSOR = "cursor";

/** Este pacote não conhece DOM nem Node; o temporizador existe nos dois. */
const sleep = (ms: number) =>
  new Promise<void>((resolve) =>
    (globalThis as unknown as { setTimeout: (fn: () => void, ms: number) => unknown }).setTimeout(resolve, ms),
  );

/**
 * Cliente local-first sobre o TanStack DB. Uma coleção por tabela do
 * protocolo; o servidor é a fonte das linhas sincronizadas e as alterações
 * locais ficam por cima, otimistas, até o servidor confirmar.
 *
 * O domínio continua puro: `update(fn)` monta o `AppData`, roda a função e
 * transforma a diferença em mutações das coleções, numa transação só, guardada
 * na fila offline até chegar ao servidor.
 */
export class SyncClient {
  readonly collections: SyncCollections;
  private readonly channels = new Map<TableName, Params>();
  private readonly memoryCursor = new Map<TableName, number>();
  private readonly executor: OfflineExecutor;
  private state: SyncState = { status: "idle", ready: false, pending: 0, rejected: [] };
  private readonly listeners = new Set<(state: SyncState) => void>();
  private readonly dataListeners = new Set<() => void>();
  private cachedData: AppData | null = null;
  private readonly subscriptions: { unsubscribe(): void }[] = [];
  private pulling: Promise<void> | null = null;
  /** Transações desta sessão ainda não confirmadas. */
  private tracked = 0;
  private again = false;
  private readyResolve!: () => void;
  private readonly readyPromise = new Promise<void>((resolve) => {
    this.readyResolve = resolve;
  });

  constructor(private readonly options: SyncClientOptions) {
    const persist = options.persist ?? ((o) => o);
    this.collections = Object.fromEntries(
      TABLES.map((table) => [
        table,
        createCollection(
          persist({
            id: table,
            getKey: (row) => row.id,
            startSync: true,
            gcTime: 0,
            sync: {
              rowUpdateMode: "full",
              sync: (params) => {
                this.channels.set(table, params);
                if (this.channels.size === TABLES.length) void this.firstPull();
                return () => {
                  this.channels.delete(table);
                };
              },
            },
          }) as never,
        ),
      ]),
    ) as unknown as SyncCollections;

    // Qualquer mudança numa coleção invalida o `AppData` montado.
    for (const table of TABLES)
      this.subscriptions.push(
        (this.collections[table] as unknown as Collection<AnyRow, string>).subscribeChanges(() => {
          this.cachedData = null;
          for (const listener of this.dataListeners) listener();
        }),
      );

    this.executor = startOfflineExecutor({
      collections: this.collections as unknown as Record<string, Collection<object, string>>,
      mutationFns: { push: ({ transaction, idempotencyKey }) => this.pushTransaction(transaction.mutations, idempotencyKey) },
      storage: options.storage,
      leaderElection: options.leaderElection,
      onlineDetector: options.onlineDetector,
      shouldRetry: (error) => (error instanceof OfflineError ? true : undefined),
    });
  }

  // ---------- leitura ----------

  getState = (): SyncState => this.state;

  subscribe = (listener: (state: SyncState) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Espera os dados locais e a fila offline carregarem. */
  async start(): Promise<void> {
    await Promise.all([this.readyPromise, this.executor.waitForInit()]);
    this.refreshPending();
  }

  /** O `AppData` atual (sincronizado com as alterações locais por cima). Mesma referência até mudar. */
  data = (): AppData =>
    (this.cachedData ??= assemble((table) =>
      [...this.collections[table].values()].map((row) => plain(row as AnyRow)),
    ));

  /** Avisa quando o `AppData` muda (para `useSyncExternalStore`). */
  subscribeData = (listener: () => void) => {
    this.dataListeners.add(listener);
    return () => {
      this.dataListeners.delete(listener);
    };
  };

  // ---------- escrita ----------

  /** Altera os dados com uma função de domínio. Nunca espera a rede. */
  update(change: (data: AppData) => AppData): AppData {
    const prev = this.data();
    const next = change(prev);
    if (next === prev) return prev;
    const mutations = diffData(prev, next);
    if (!mutations.length) return next;
    const tx = this.executor.createOfflineTransaction({ mutationFnName: "push", autoCommit: false });
    tx.mutate(() => {
      for (const m of mutations) {
        const collection = this.collections[m.table] as unknown as Collection<AnyRow, string>;
        if (m.op === "delete") {
          if (collection.has(m.rowId)) collection.delete(m.rowId);
        } else if (collection.has(m.rowId)) {
          const row = m.row as AnyRow;
          collection.update(m.rowId, (draft) => {
            for (const key of Object.keys(draft))
              if (!key.startsWith("$") && !(key in row)) delete (draft as Record<string, unknown>)[key];
            Object.assign(draft, row);
          });
        } else {
          collection.insert(m.row as AnyRow);
        }
      }
    });
    this.track(tx.commit());
    return next;
  }

  /** O estudante viu as recusas; tira da lista. */
  dismissRejected() {
    this.setState({ rejected: [] });
  }

  // ---------- rede ----------

  /** Busca o que mudou no servidor. Chamadas durante uma busca marcam outra rodada. */
  sync(): Promise<void> {
    if (this.pulling) {
      this.again = true;
      return this.pulling;
    }
    this.pulling = this.pullLoop().finally(() => {
      this.pulling = null;
    });
    return this.pulling;
  }

  /** Avisa que a rede voltou: a fila tenta de novo na hora. */
  online() {
    this.executor.getOnlineDetector().notifyOnline();
    void this.sync();
  }

  /** Última versão do servidor já aplicada em todas as coleções. */
  cursor(): number {
    let min = Number.POSITIVE_INFINITY;
    for (const table of TABLES) {
      const stored = this.channels.get(table)?.metadata?.collection.get(CURSOR);
      min = Math.min(min, typeof stored === "number" ? stored : (this.memoryCursor.get(table) ?? 0));
    }
    return Number.isFinite(min) ? min : 0;
  }

  /** Espera a fila esvaziar e a busca em andamento terminar (testes e saída). */
  async flush(): Promise<void> {
    while (this.unsettled() > 0 || this.pulling) {
      await (this.pulling ?? sleep(5));
    }
  }

  dispose() {
    for (const subscription of this.subscriptions) subscription.unsubscribe();
    this.executor.dispose();
    for (const collection of Object.values(this.collections)) void collection.cleanup().catch(() => undefined);
  }

  private async firstPull() {
    // Com persistência, o cursor salvo só aparece depois de carregar o que está no aparelho.
    await Promise.all(
      [...this.channels.values()].map((params) =>
        (params.metadata as { persistence?: { hydrateBaseline(): Promise<void> } | null } | undefined)?.persistence
          ?.hydrateBaseline()
          .catch(() => undefined),
      ),
    );
    await this.sync();
    for (const params of this.channels.values()) params.markReady();
    this.setState({ ready: true });
    this.readyResolve();
  }

  private async pullLoop() {
    do {
      this.again = false;
      this.setStatus("syncing");
      try {
        await this.pullAll();
        this.setStatus("idle");
      } catch (error) {
        this.setStatus(error instanceof OfflineError ? "offline" : "error");
        return;
      }
    } while (this.again);
  }

  private async pullAll() {
    for (;;) {
      const since = this.cursor();
      const page = await this.options.transport.pull(since);
      const byTable = new Map<TableName, PullResponse["changes"]>();
      for (const change of page.changes) {
        const list = byTable.get(change.table) ?? [];
        list.push(change);
        byTable.set(change.table, list);
      }
      for (const table of TABLES) {
        const params = this.channels.get(table);
        if (!params) continue;
        const changes = byTable.get(table) ?? [];
        params.begin();
        for (const change of changes) {
          if (change.deleted) {
            if (params.collection.has(change.row.id)) params.write({ type: "delete", key: change.row.id });
          } else {
            params.write({ type: "update", value: cleanRow(change.row) as AnyRow });
          }
        }
        if (params.metadata) params.metadata.collection.set(CURSOR, page.version);
        else this.memoryCursor.set(table, page.version);
        params.commit();
      }
      if (!page.hasMore) return;
    }
  }

  /**
   * Envia as mutações de uma transação. Os ids derivam da chave de
   * idempotência, então reenviar depois de uma falha não aplica duas vezes.
   */
  private async pushTransaction(pending: PendingMutation[], idempotencyKey: string) {
    const mutations = orderBatch(pending.map((m, i) => toMutation(m, `${idempotencyKey}:${i}`)));
    const rejected: RejectedMutation[] = [];
    try {
      for (let i = 0; i < mutations.length; i += MAX_BATCH) {
        const batch = mutations.slice(i, i + MAX_BATCH);
        const response = await this.options.transport.push({ mutations: batch });
        const byId = new Map(batch.map((m) => [m.id, m]));
        for (const r of response.rejected) {
          const mutation = byId.get(r.id);
          if (mutation) rejected.push({ ...r, mutation });
        }
      }
    } catch (error) {
      if (error instanceof OfflineError) {
        this.setStatus("offline");
        throw error;
      }
      throw new NonRetriableError(error instanceof Error ? error.message : String(error));
    }
    if (rejected.length) this.setState({ rejected: [...this.state.rejected, ...rejected] });
    void sleep(0).then(() => this.refreshPending());
    // O TanStack DB pede que as linhas do servidor cheguem antes de a transação terminar.
    await this.sync();
  }

  private track(done: Promise<unknown>) {
    this.tracked += 1;
    this.refreshPending();
    done
      .catch(() => undefined)
      .finally(() => {
        this.tracked -= 1;
        this.refreshPending();
      });
  }

  /** Transações na fila: as desta sessão e as restauradas de antes. */
  private unsettled() {
    return Math.max(this.tracked, this.executor.getPendingCount() + this.executor.getRunningCount());
  }

  private refreshPending() {
    const pending = this.unsettled();
    if (pending !== this.state.pending) this.setState({ pending });
  }

  private setStatus(status: SyncStatus) {
    if (this.state.status !== status) this.setState({ status });
  }

  private setState(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }
}

function toMutation(m: PendingMutation, id: string): Mutation {
  const table = m.collection.id as TableName;
  const rowId = String(m.key);
  if (m.type === "delete") return { id, table, op: "delete", rowId };
  return { id, table, op: "upsert", rowId, row: plain(m.modified as AnyRow) };
}

