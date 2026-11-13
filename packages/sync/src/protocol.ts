import { z } from "zod";
import { type Row, TABLES, type TableName } from "./tables";

/**
 * Uma alteração em uma linha. `id` identifica a mutação (idempotência):
 * reenviar a mesma mutação não aplica nada duas vezes.
 */
export type Mutation =
  | { id: string; table: TableName; op: "upsert"; rowId: string; row: Row }
  | { id: string; table: TableName; op: "delete"; rowId: string };

export const MAX_BATCH = 200;

/** Envelope validado no servidor; a linha é validada depois, pela tabela. */
export const PushRequestSchema = z.strictObject({
  mutations: z
    .array(
      z.strictObject({
        id: z.string().min(1).max(64),
        table: z.enum(TABLES),
        op: z.enum(["upsert", "delete"]),
        rowId: z.string().min(1).max(64),
        row: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .max(MAX_BATCH),
});
export type PushRequest = { mutations: Mutation[] };

export type Rejection = { id: string; reason: string };

export type PushResponse = {
  /** Mutações aplicadas agora ou já aplicadas antes. */
  accepted: string[];
  /** Mutações recusadas, com o motivo para mostrar ao estudante. */
  rejected: Rejection[];
  /** Última versão do usuário depois do push. */
  version: number;
};

export type PulledRow = {
  table: TableName;
  row: Row;
  deleted: boolean;
  version: number;
};

export type PullResponse = {
  changes: PulledRow[];
  /** Cursor para o próximo pull. */
  version: number;
  /** Há mais mudanças além desta página. */
  hasMore: boolean;
};

/** Aviso enviado pelo WebSocket quando outro aparelho grava algo. */
export type SyncNotice = { type: "version"; version: number };

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
