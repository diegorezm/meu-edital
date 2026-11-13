import { type AppData, emptyData } from "@meu-edital/domain";
import type { PulledRow } from "./protocol";
import { collectionOf, type Row, SETTINGS_ID, type TableName } from "./tables";

type AnyRow = Row & { id: string };

/** A linha sem os campos virtuais do TanStack DB (`$key`, `$origin`...) e sem `undefined`. */
export function plain<T extends object>(row: T): T {
  return Object.fromEntries(
    Object.entries(row).filter(([key, value]) => !key.startsWith("$") && value !== undefined),
  ) as T;
}

/** Monta o `AppData` a partir das linhas de cada tabela. */
export function assemble(rowsOf: (table: TableName) => AnyRow[]): AppData {
  const data: AppData = emptyData();
  const settings = rowsOf("userSettings").find((r) => r.id === SETTINGS_ID) as Row<"userSettings"> | undefined;
  if (settings) {
    data.activeExamId = settings.activeExamId;
    data.reviewOffsets = settings.reviewOffsets;
    data.skin = settings.skin as AppData["skin"];
    data.seenCelebrations = settings.seenCelebrations;
  }
  for (const [table, key] of Object.entries(collectionOf) as [TableName, keyof AppData][])
    (data as Record<string, unknown>)[key] = rowsOf(table);
  return data;
}

/** Reconstrói o `AppData` a partir das linhas puxadas (vale a versão mais nova de cada linha). */
export function dataFromRows(changes: PulledRow[]): AppData {
  const byTable = new Map<TableName, Map<string, AnyRow>>();
  for (const change of changes) {
    const rows = byTable.get(change.table) ?? new Map<string, AnyRow>();
    if (change.deleted) rows.delete(change.row.id);
    else rows.set(change.row.id, change.row as AnyRow);
    byTable.set(change.table, rows);
  }
  return assemble((table) => [...(byTable.get(table)?.values() ?? [])]);
}
