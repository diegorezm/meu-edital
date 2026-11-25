import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import {
  MAX_PROPOSAL_BYTES,
  previewProposal,
  type Proposal,
  type ProposalInput,
  proposalExpiry,
  proposalSize,
} from "@meu-edital/agent-context";
import { type Db, proposals, type StudyTableName, studyTables } from "@meu-edital/db";
import { type AppData, uid } from "@meu-edital/domain";
import { assemble, type Row, SETTINGS_ID, type TableName } from "@meu-edital/sync";

const META = new Set(["userId", "updatedAt", "deletedAt", "version"]);

function toActiveRow(table: TableName, row: Record<string, unknown>): Row & { id: string } {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row))
    if (!META.has(key) && value !== null) clean[key] = value;
  if (table === "userSettings") {
    clean.id = SETTINGS_ID;
    if (!("activeExamId" in clean)) clean.activeExamId = null;
  }
  return clean as Row & { id: string };
}

/**
 * Dados ativos de estudo do usuário montados diretamente em um único `db.batch()`,
 * filtrando `deleted_at IS NULL` (sem ler tombstones nem paginar).
 */
export async function loadAppData(db: Db, userId: string): Promise<AppData> {
  const names = Object.keys(studyTables) as StudyTableName[];
  const queries: BatchItem<"sqlite">[] = names.map((name) => {
    const table = studyTables[name];
    return db
      .select()
      .from(table)
      .where(and(eq(table.userId, userId), isNull(table.deletedAt)));
  });
  const results = (await db.batch(
    queries as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]],
  )) as unknown as Record<string, unknown>[][];
  const byTable = new Map<TableName, (Row & { id: string })[]>();
  for (let i = 0; i < names.length; i += 1) {
    byTable.set(
      names[i],
      (results[i] ?? []).map((row) => toActiveRow(names[i], row)),
    );
  }
  return assemble((table) => byTable.get(table) ?? []);
}

export class ProposalError extends Error {}

/** Caixa de propostas do usuário da sessão (ou da conexão MCP). */
export function proposalsData(db: Db, userId: string) {
  return {
    async pending(now = Date.now()): Promise<Proposal[]> {
      const rows = await db
        .select()
        .from(proposals)
        .where(and(eq(proposals.userId, userId), eq(proposals.status, "pendente"), gt(proposals.expiresAt, now)))
        .orderBy(desc(proposals.createdAt))
        .limit(50);
      return rows.map(({ userId: _user, ...row }) => row as Proposal);
    },

    /**
     * Guarda uma proposta depois de validar o formato (já feito pelo Zod),
     * o tamanho e se tudo o que ela cita existe nos dados atuais.
     */
    async create(
      input: ProposalInput,
      meta: { source: Proposal["source"]; author: string; examId?: string },
      now = Date.now(),
    ): Promise<Proposal> {
      if (proposalSize(input) > MAX_PROPOSAL_BYTES)
        throw new ProposalError("A proposta é grande demais. Divida em partes menores.");
      const [{ total }] = await db
        .select({ total: count() })
        .from(proposals)
        .where(and(eq(proposals.userId, userId), eq(proposals.status, "pendente"), gt(proposals.expiresAt, now)));
      if (total >= 50)
        throw new ProposalError("A caixa de propostas está cheia (limite de 50). Aplique ou descarte algumas antes.");
      const data = await loadAppData(db, userId);
      const examId = meta.examId ?? data.activeExamId ?? "";
      // Um concurso novo não depende do ativo; o resto precisa de um concurso.
      if (input.payload.kind !== "exam" && !data.exams.some((e) => e.id === examId))
        throw new ProposalError("O estudante ainda não tem um concurso ativo.");
      try {
        previewProposal(data, examId, input.payload);
      } catch (error) {
        throw new ProposalError(error instanceof Error ? error.message : "Proposta inválida.");
      }
      const proposal: Proposal = {
        id: uid(),
        source: meta.source,
        author: meta.author.slice(0, 80) || "IA",
        examId,
        reason: input.reason,
        payload: input.payload,
        status: "pendente",
        createdAt: now,
        expiresAt: proposalExpiry(now),
      };
      await db.insert(proposals).values({ ...proposal, userId });
      return proposal;
    },

    async setStatus(id: string, status: "aplicada" | "descartada", now = Date.now()) {
      const result = await db
        .update(proposals)
        .set({ status })
        .where(
          and(
            eq(proposals.id, id),
            eq(proposals.userId, userId),
            eq(proposals.status, "pendente"),
            gt(proposals.expiresAt, now),
          ),
        )
        .returning({ id: proposals.id });
      return result.length > 0;
    },
  };
}
