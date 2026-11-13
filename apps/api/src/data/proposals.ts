import { and, desc, eq, gt } from "drizzle-orm";
import {
  MAX_PROPOSAL_BYTES,
  previewProposal,
  type Proposal,
  type ProposalInput,
  proposalExpiry,
  proposalSize,
} from "@meu-edital/agent-context";
import { type Db, proposals } from "@meu-edital/db";
import { type AppData, emptyData, uid } from "@meu-edital/domain";
import { applyPulled } from "@meu-edital/sync";
import { syncData } from "./sync";

/** Dados de estudo do usuário montados a partir do banco (para o MCP e para validar propostas). */
export async function loadAppData(db: Db, userId: string): Promise<AppData> {
  const sync = syncData(db, userId);
  let since = 0;
  let data = emptyData();
  for (;;) {
    const page = await sync.pull(since, 2000);
    data = applyPulled(data, page.changes.filter((c) => !c.deleted));
    if (!page.hasMore) return data;
    since = page.version;
  }
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

    async setStatus(id: string, status: "aplicada" | "descartada") {
      const result = await db
        .update(proposals)
        .set({ status })
        .where(and(eq(proposals.id, id), eq(proposals.userId, userId), eq(proposals.status, "pendente")))
        .returning({ id: proposals.id });
      return result.length > 0;
    },
  };
}
