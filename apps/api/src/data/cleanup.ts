import { and, eq, lt, or } from "drizzle-orm";
import { type Db, proposals, session, syncMutations, verification } from "@meu-edital/db";

const MUTATION_RETENTION_MS = 30 * 86_400_000;
const PROPOSAL_ARCHIVE_MS = 30 * 86_400_000;

/**
 * Limpeza diária de registros expirados (executada no cron do Worker):
 * sessões e verificações vencidas, histórico antigo de idempotência do sync
 * e propostas expiradas.
 */
export async function runHousekeeping(db: Db, now = Date.now()): Promise<void> {
  const cutoffDate = new Date(now);
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
  ]);
}
