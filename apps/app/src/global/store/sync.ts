import type { AppData } from "@meu-edital/domain";
import {
  type Row,
  type SettingsRow,
  settingsRow,
  type TableName,
  tables,
} from "./remoteSchema";

export type SyncOp =
  | { kind: "upsert"; table: TableName; rows: Row[] }
  | { kind: "delete"; table: TableName; ids: string[] }
  | { kind: "settings"; row: SettingsRow };

const BATCH = 500;

function chunk<T>(items: T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += BATCH)
    result.push(items.slice(index, index + BATCH));
  return result;
}

/** Assuntos-pai antes dos subassuntos, para respeitar a chave estrangeira. */
function parentsFirst(rows: Row[], all: Row[]): Row[] {
  const byId = new Map(all.map((row) => [row.id, row]));
  const depth = (row: Row) => {
    let value = 0;
    let parent = row.parent_id as string | null;
    while (parent && value < 8) {
      value += 1;
      parent = (byId.get(parent)?.parent_id as string | null) ?? null;
    }
    return value;
  };
  return [...rows].sort((a, b) => depth(a) - depth(b));
}

/**
 * Operações que levam o banco remoto do estado `prev` ao estado `next`.
 * Exclusões vêm primeiro (filhos antes dos pais) e gravações depois (pais
 * antes dos filhos), respeitando as chaves estrangeiras.
 */
export function diffData(
  prev: AppData | null,
  next: AppData,
  userId: string,
): SyncOp[] {
  const deletes: SyncOp[] = [];
  const upserts: SyncOp[] = [];
  for (const table of tables) {
    const before = new Map(
      (prev ? table.rows(prev) : []).map((item) => {
        const row = table.toRow(item);
        return [row.id, JSON.stringify(row)];
      }),
    );
    const nextRows = table.rows(next).map(table.toRow);
    const nextIds = new Set(nextRows.map((row) => row.id));
    const removed = [...before.keys()].filter((id) => !nextIds.has(id));
    let changed = nextRows.filter(
      (row) => before.get(row.id) !== JSON.stringify(row),
    );
    if (table.name === "topics") changed = parentsFirst(changed, nextRows);
    for (const ids of chunk(removed))
      deletes.unshift({ kind: "delete", table: table.name, ids });
    for (const rows of chunk(changed))
      upserts.push({ kind: "upsert", table: table.name, rows });
  }
  const settings = settingsRow(next, userId);
  const settingsChanged =
    !prev ||
    JSON.stringify(settingsRow(prev, userId)) !== JSON.stringify(settings);
  return [
    ...deletes,
    ...upserts,
    ...(settingsChanged ? [{ kind: "settings" as const, row: settings }] : []),
  ];
}
