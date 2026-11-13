import { type AppData, uid } from "@meu-edital/domain";
import type { Mutation } from "./protocol";
import { collectionOf, type Row, SETTINGS_ID, settingsRow, TABLES, type TableName } from "./tables";

/** Igualdade estrutural de valores JSON, ignorando chaves com `undefined`. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((item, i) => sameValue(item, b[i]));
  const keys = (value: object) =>
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k]) => k);
  const ka = keys(a);
  const kb = keys(b);
  return (
    ka.length === kb.length &&
    ka.every((key) =>
      sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}

/** Remove chaves com `undefined`, para a linha virar JSON limpo. */
export function cleanRow<T extends object>(row: T): T {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined)) as T;
}

type Collection = { id: string }[];

/**
 * Mutações que levam `prev` a `next`, por linha. Saem em ordem segura:
 * inserções dos pais para os filhos e exclusões dos filhos para os pais.
 */
export function diffData(prev: AppData, next: AppData): Mutation[] {
  const upserts: Mutation[] = [];
  const deletes: Mutation[] = [];
  if (!sameValue(settingsRow(prev), settingsRow(next)))
    upserts.push({
      id: uid(),
      table: "userSettings",
      op: "upsert",
      rowId: SETTINGS_ID,
      row: settingsRow(next),
    });
  for (const table of TABLES) {
    if (table === "userSettings") continue;
    const before = prev[collectionOf[table]] as Collection;
    const after = next[collectionOf[table]] as Collection;
    if (before === after) continue;
    const old = new Map(before.map((row) => [row.id, row]));
    const current = new Set<string>();
    for (const row of after) {
      current.add(row.id);
      const previous = old.get(row.id);
      if (!previous || !sameValue(previous, row))
        upserts.push({
          id: uid(),
          table,
          op: "upsert",
          rowId: row.id,
          row: cleanRow(row) as Row,
        });
    }
    for (const row of before)
      if (!current.has(row.id)) deletes.push({ id: uid(), table, op: "delete", rowId: row.id });
  }
  return [...upserts, ...orderDeletes(deletes)];
}

const rank = (table: TableName) => TABLES.indexOf(table);
const orderDeletes = (items: Mutation[]) =>
  [...items].sort((a, b) => rank(b.table) - rank(a.table));

/** Põe um lote em ordem segura sem mudar a ordem relativa dentro de cada grupo. */
export function orderBatch(mutations: Mutation[]): Mutation[] {
  const upserts = mutations
    .filter((m) => m.op === "upsert")
    .map((m, i) => ({ m, i }))
    .sort((a, b) => rank(a.m.table) - rank(b.m.table) || a.i - b.i)
    .map(({ m }) => m);
  const deletes = orderDeletes(mutations.filter((m) => m.op === "delete"));
  return [...upserts, ...deletes];
}

