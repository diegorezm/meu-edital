import type { AppData } from "@meu-edital/domain";
import type { Mutation, PulledRow } from "./protocol";
import { collectionOf, type Row } from "./tables";

const pendingKeys = (outbox: Mutation[]) => new Set(outbox.map((m) => `${m.table}:${m.rowId}`));

/**
 * Aplica no estado local o que veio do servidor. Linhas com mutação local
 * pendente são puladas: a versão local vale até ser enviada, e aí o
 * servidor decide (vence a última escrita que chega).
 */
export function applyPulled(data: AppData, changes: PulledRow[], outbox: Mutation[] = []): AppData {
  if (!changes.length) return data;
  const pending = pendingKeys(outbox);
  const next: AppData = { ...data };
  const touched = new Map<string, Map<string, { id: string }>>();
  const rowsOf = (key: keyof AppData) => {
    let rows = touched.get(key);
    if (!rows) {
      rows = new Map((data[key] as { id: string }[]).map((row) => [row.id, row]));
      touched.set(key, rows);
    }
    return rows;
  };
  for (const change of changes) {
    if (pending.has(`${change.table}:${change.row.id}`)) continue;
    if (change.table === "userSettings") {
      if (change.deleted) continue;
      const settings = change.row as Row<"userSettings">;
      next.activeExamId = settings.activeExamId;
      next.reviewOffsets = settings.reviewOffsets;
      next.skin = settings.skin as AppData["skin"];
      next.seenCelebrations = settings.seenCelebrations;
      continue;
    }
    const rows = rowsOf(collectionOf[change.table]);
    if (change.deleted) rows.delete(change.row.id);
    else rows.set(change.row.id, change.row);
  }
  for (const [key, rows] of touched)
    (next as Record<string, unknown>)[key] = [...rows.values()];
  return next;
}
