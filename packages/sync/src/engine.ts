import type { AppData } from "@meu-edital/domain";
import { diffData, enqueue, orderBatch } from "./diff";
import { applyPulled } from "./merge";
import {
  MAX_BATCH,
  type Mutation,
  type PullResponse,
  type PushRequest,
  type PushResponse,
  type Rejection,
} from "./protocol";

/** O que o aparelho guarda: os dados, a fila de mutações e o cursor do pull. */
export type Snapshot = {
  data: AppData;
  outbox: Mutation[];
  /** Última versão do servidor já aplicada aqui. */
  cursor: number;
  /** Mutações recusadas pelo servidor, ainda não vistas pelo estudante. */
  rejected: (Rejection & { mutation: Mutation })[];
};

/** Banco local (IndexedDB na web, SQLite no app). */
export type LocalStore = {
  load(): Promise<Snapshot | null>;
  save(snapshot: Snapshot): Promise<void>;
};

/** Rede. Deve lançar `OfflineError` quando não há conexão. */
export type Transport = {
  push(request: PushRequest): Promise<PushResponse>;
  pull(since: number): Promise<PullResponse>;
};

export class OfflineError extends Error {
  constructor(cause?: unknown) {
    super("Sem conexão.", { cause });
    this.name = "OfflineError";
  }
}

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

export type SyncState = Snapshot & { status: SyncStatus; ready: boolean };

/**
 * Motor local-first. A tela lê e altera `state.data` na hora, e o motor
 * transforma cada alteração em mutações na fila, salva no banco local e
 * sincroniza quando pode. Sem React e sem DOM: serve a qualquer cliente.
 */
export class SyncEngine {
  private snapshot: Snapshot;
  private status: SyncStatus = "idle";
  private ready = false;
  private running: Promise<void> | null = null;
  private again = false;
  private saving: Promise<void> = Promise.resolve();
  private listeners = new Set<(state: SyncState) => void>();
  private cached: SyncState;

  constructor(
    private readonly store: LocalStore,
    private readonly transport: Transport,
    initial: () => AppData,
  ) {
    this.snapshot = { data: initial(), outbox: [], cursor: 0, rejected: [] };
    this.cached = this.compose();
  }

  /** Carrega o banco local. Chame uma vez antes de usar. */
  async start(): Promise<void> {
    const saved = await this.store.load();
    if (saved) this.snapshot = { ...saved, rejected: saved.rejected ?? [] };
    this.ready = true;
    this.emit();
  }

  getState = (): SyncState => this.cached;

  subscribe = (listener: (state: SyncState) => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Altera os dados com uma função de domínio. Nunca espera a rede. */
  update(change: (data: AppData) => AppData): AppData {
    const prev = this.snapshot.data;
    const next = change(prev);
    if (next === prev) return prev;
    const mutations = diffData(prev, next);
    this.snapshot = {
      ...this.snapshot,
      data: next,
      outbox: enqueue(this.snapshot.outbox, mutations),
    };
    this.persist();
    this.emit();
    return next;
  }

  /** O estudante viu as recusas; tira da lista. */
  dismissRejected() {
    this.snapshot = { ...this.snapshot, rejected: [] };
    this.persist();
    this.emit();
  }

  /**
   * Envia a fila e busca o que mudou. Chamadas durante uma sincronização
   * marcam uma nova rodada em vez de rodar em paralelo.
   */
  sync(): Promise<void> {
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = this.loop().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /** Espera a gravação local pendente (útil em testes e ao sair). */
  flush(): Promise<void> {
    return this.saving;
  }

  private async loop() {
    do {
      this.again = false;
      this.setStatus("syncing");
      try {
        await this.pushAll();
        await this.pullAll();
        this.setStatus("idle");
      } catch (error) {
        this.setStatus(error instanceof OfflineError ? "offline" : "error");
        return;
      }
    } while (this.again);
  }

  private async pushAll() {
    while (this.snapshot.outbox.length) {
      const batch = orderBatch(this.snapshot.outbox.slice(0, MAX_BATCH));
      const response = await this.transport.push({ mutations: batch });
      const done = new Set([...response.accepted, ...response.rejected.map((r) => r.id)]);
      if (!done.size) throw new Error("O servidor não respondeu às mutações.");
      const byId = new Map(batch.map((m) => [m.id, m]));
      this.snapshot = {
        ...this.snapshot,
        outbox: this.snapshot.outbox.filter((m) => !done.has(m.id)),
        rejected: [
          ...this.snapshot.rejected,
          ...response.rejected.flatMap((r) => {
            const mutation = byId.get(r.id);
            return mutation ? [{ ...r, mutation }] : [];
          }),
        ],
      };
      this.persist();
      this.emit();
    }
  }

  private async pullAll() {
    for (;;) {
      const page = await this.transport.pull(this.snapshot.cursor);
      this.snapshot = {
        ...this.snapshot,
        data: applyPulled(this.snapshot.data, page.changes, this.snapshot.outbox),
        cursor: Math.max(this.snapshot.cursor, page.version),
      };
      this.persist();
      this.emit();
      if (!page.hasMore) return;
    }
  }

  private persist() {
    const snapshot = this.snapshot;
    this.saving = this.saving.then(() => this.store.save(snapshot)).catch(() => undefined);
  }

  private setStatus(status: SyncStatus) {
    if (this.status === status) return;
    this.status = status;
    this.emit();
  }

  private compose(): SyncState {
    return { ...this.snapshot, status: this.status, ready: this.ready };
  }

  private emit() {
    this.cached = this.compose();
    for (const listener of this.listeners) listener(this.cached);
  }
}

/** Banco local em memória, para testes e para quando o armazenamento falha. */
export function memoryStore(initial: Snapshot | null = null): LocalStore & { saved: Snapshot | null } {
  const store = {
    saved: initial,
    async load() {
      return store.saved;
    },
    async save(snapshot: Snapshot) {
      store.saved = JSON.parse(JSON.stringify(snapshot)) as Snapshot;
    },
  };
  return store;
}
