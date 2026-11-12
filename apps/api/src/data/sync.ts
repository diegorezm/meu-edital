import { and, asc, eq, getTableColumns, gt, inArray, lt, ne, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { type Db, type StudyTableName, studyTables, syncCounters, syncMutations } from "@meu-edital/db";
import {
  type Mutation,
  type PulledRow,
  type PullResponse,
  type PushResponse,
  type Rejection,
  type Row,
  rowSchemas,
  SETTINGS_ID,
  type TableName,
} from "@meu-edital/sync";

const META = new Set(["userId", "updatedAt", "deletedAt", "version"]);
const PULL_LIMIT = 500;
const MUTATION_RETENTION_MS = 30 * 86_400_000;

type Incoming = { id: string; table: TableName; op: "upsert" | "delete"; rowId: string; row?: unknown };

/**
 * Escrita e leitura do sync, sempre presas ao `userId` da sessão.
 *
 * Push: cada mutação válida incrementa o contador do usuário e grava a linha
 * com essa versão, tudo em um único lote do D1 (atômico). Vence a última
 * escrita que chega. Mutações repetidas são ignoradas; inválidas ou que tocam
 * linha de outro usuário voltam recusadas com o motivo.
 */
export function syncData(db: Db, userId: string) {
  /** Id da linha no banco: as preferências usam o id do usuário. */
  const dbId = (table: TableName, rowId: string) =>
    table === "userSettings" ? userId : rowId;

  const nextVersion = sql`(select ${syncCounters.version} from ${syncCounters} where ${syncCounters.userId} = ${userId})`;

  async function alreadyApplied(ids: string[]) {
    if (!ids.length) return new Set<string>();
    const rows = await db
      .select({ id: syncMutations.mutationId })
      .from(syncMutations)
      .where(and(eq(syncMutations.userId, userId), inArray(syncMutations.mutationId, ids)));
    return new Set(rows.map((row) => row.id));
  }

  /** Ids que já existem e pertencem a outro usuário, por tabela. */
  async function foreignIds(mutations: Incoming[]) {
    const taken = new Set<string>();
    const byTable = new Map<TableName, string[]>();
    for (const m of mutations) {
      if (m.table === "userSettings") continue;
      byTable.set(m.table, [...(byTable.get(m.table) ?? []), m.rowId]);
    }
    for (const [name, ids] of byTable) {
      const table = studyTables[name];
      const rows = await db
        .select({ id: table.id })
        .from(table)
        .where(and(inArray(table.id, ids), ne(table.userId, userId)));
      for (const row of rows) taken.add(`${name}:${row.id}`);
    }
    return taken;
  }

  function upsertStatement(name: TableName, row: Record<string, unknown>, now: number) {
    const table = studyTables[name];
    const values: Record<string, unknown> = {};
    for (const key of Object.keys(getTableColumns(table)))
      if (!META.has(key)) values[key] = row[key] ?? null;
    values.id = dbId(name, String(row.id));
    const { id: _id, ...changes } = values;
    return db
      .insert(table)
      .values({ ...values, userId, updatedAt: now, deletedAt: null, version: nextVersion } as never)
      .onConflictDoUpdate({
        target: table.id,
        set: { ...changes, updatedAt: now, deletedAt: null, version: nextVersion } as never,
        setWhere: eq(table.userId, userId),
      });
  }

  function deleteStatement(name: TableName, rowId: string, now: number) {
    const table = studyTables[name];
    return db
      .update(table)
      .set({ deletedAt: now, updatedAt: now, version: nextVersion } as never)
      .where(and(eq(table.id, dbId(name, rowId)), eq(table.userId, userId)));
  }

  async function currentVersion() {
    const [row] = await db
      .select({ version: syncCounters.version })
      .from(syncCounters)
      .where(eq(syncCounters.userId, userId));
    return row?.version ?? 0;
  }

  return {
    async push(mutations: Incoming[]): Promise<PushResponse> {
      const now = Date.now();
      const applied = await alreadyApplied(mutations.map((m) => m.id));
      const taken = await foreignIds(mutations.filter((m) => !applied.has(m.id)));
      const accepted: string[] = [];
      const rejected: Rejection[] = [];
      const statements: BatchItem<"sqlite">[] = [];
      const seen = new Set<string>();

      for (const m of mutations) {
        if (applied.has(m.id) || seen.has(m.id)) {
          accepted.push(m.id);
          continue;
        }
        seen.add(m.id);
        if (taken.has(`${m.table}:${m.rowId}`)) {
          rejected.push({ id: m.id, reason: "Esse registro pertence a outra conta." });
          continue;
        }
        let write: BatchItem<"sqlite">;
        if (m.op === "upsert") {
          const parsed = rowSchemas[m.table].safeParse(m.row);
          if (!parsed.success) {
            const issue = parsed.error.issues[0];
            rejected.push({
              id: m.id,
              reason: `Dado inválido em ${m.table}${issue?.path.length ? `.${issue.path.join(".")}` : ""}.`,
            });
            continue;
          }
          if (parsed.data.id !== m.rowId) {
            rejected.push({ id: m.id, reason: "O id da linha não confere com a mutação." });
            continue;
          }
          write = upsertStatement(m.table, parsed.data as Record<string, unknown>, now);
        } else {
          write = deleteStatement(m.table, m.rowId, now);
        }
        statements.push(
          db
            .update(syncCounters)
            .set({ version: sql`${syncCounters.version} + 1` })
            .where(eq(syncCounters.userId, userId)),
          write,
          db.insert(syncMutations).values({ userId, mutationId: m.id, appliedAt: now }).onConflictDoNothing(),
        );
        accepted.push(m.id);
      }

      if (statements.length) {
        await db.batch([
          db.insert(syncCounters).values({ userId, version: 0 }).onConflictDoNothing(),
          ...statements,
        ] as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
      }
      return { accepted, rejected, version: await currentVersion() };
    },

    async pull(since: number, limit = PULL_LIMIT): Promise<PullResponse> {
      const changes: PulledRow[] = [];
      for (const name of Object.keys(studyTables) as StudyTableName[]) {
        const table = studyTables[name];
        const rows = await db
          .select()
          .from(table)
          .where(and(eq(table.userId, userId), gt(table.version, since)))
          .orderBy(asc(table.version))
          .limit(limit + 1);
        for (const row of rows) changes.push(toPulled(name, row as Record<string, unknown>));
      }
      changes.sort((a, b) => a.version - b.version);
      const page = changes.slice(0, limit);
      const hasMore = changes.length > limit;
      return {
        changes: page,
        hasMore,
        version: hasMore ? page[page.length - 1].version : Math.max(since, await currentVersion()),
      };
    },

    /** Apaga registros de idempotência antigos. */
    async pruneMutations(now = Date.now()) {
      await db
        .delete(syncMutations)
        .where(
          and(
            eq(syncMutations.userId, userId),
            lt(syncMutations.appliedAt, now - MUTATION_RETENTION_MS),
          ),
        );
    },
  };
}

/** Linha do banco no formato do protocolo: sem campos de controle e sem nulos. */
function toPulled(table: TableName, row: Record<string, unknown>): PulledRow {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row))
    if (!META.has(key) && value !== null) clean[key] = value;
  if (table === "userSettings") clean.id = SETTINGS_ID;
  if (table === "userSettings" && !("activeExamId" in clean)) clean.activeExamId = null;
  return {
    table,
    row: clean as Row,
    deleted: row.deletedAt !== null,
    version: row.version as number,
  };
}

export type SyncData = ReturnType<typeof syncData>;
export type { Mutation };
