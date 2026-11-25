import { and, eq, isNotNull, lt, or } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { type Db, proposals, session, type StudyTableName, studyTables, syncMutations, verification } from "@meu-edital/db";

const MUTATION_RETENTION_MS = 30 * 86_400_000;
const PROPOSAL_ARCHIVE_MS = 30 * 86_400_000;
const TOMBSTONE_RETENTION_MS = 180 * 86_400_000;

/**
 * Limpeza diária de registros expirados (executada no cron do Worker):
 * sessões e verificações vencidas, histórico antigo de idempotência do sync,
 * propostas expiradas e tombstones com mais de 180 dias.
 */
export async function runHousekeeping(db: Db, now = Date.now()): Promise<void> {
  const cutoffDate = new Date(now);
  const tombstoneCutoff = now - TOMBSTONE_RETENTION_MS;
  const tombstoneDeletes: BatchItem<"sqlite">[] = (Object.keys(studyTables) as StudyTableName[])
    .filter((name) => name !== "userSettings")
    .map((name) => {
      const table = studyTables[name];
      return db.delete(table).where(and(isNotNull(table.deletedAt), lt(table.deletedAt, tombstoneCutoff)));
    });
  await db.batch([
    db.delete(session).where(lt(session.expiresAt, cutoffDate)),
    db.delete(verification).where(lt(verification.expiresAt, cutoffDate)),
    db.delete(syncMutations).where(lt(syncMutations.appliedAt, now - MUTATION_RETENTION_MS)),
    db
      .delete(proposals)
      .where(
        or(
          and(eq(proposals.status, "pendente"), lt(proposals.expiresAt, now)),
          lt(proposals.expiresAt, now - PROPOSAL_ARCHIVE_MS),
        ),
      ),
    ...tombstoneDeletes,
  ] as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
}
