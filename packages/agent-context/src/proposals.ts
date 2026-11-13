import { z } from "zod";
import { addDays, type AppData, subjectsInOrder } from "@meu-edital/domain";
import { applyChanges, ChangeSchema, type ChangePreview, previewChanges } from "./changes";
import { importSyllabus, SyllabusImportSchema } from "./syllabus";

/** Propostas pendentes expiram depois deste prazo. */
export const PROPOSAL_TTL_DAYS = 7;
/** Tamanho máximo de uma proposta serializada. */
export const MAX_PROPOSAL_BYTES = 64_000;

/**
 * O que uma proposta carrega. Toda proposta é dado não confiável: a caixa
 * de propostas mostra a prévia (antes → depois) e só aplica com confirmação,
 * sempre pelas funções de domínio.
 */
export const ProposalPayloadSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("changes"),
    changes: z.array(ChangeSchema).min(1).max(30),
  }),
  z.strictObject({
    kind: z.literal("syllabus"),
    syllabus: SyllabusImportSchema,
  }),
]);
export type ProposalPayload = z.infer<typeof ProposalPayloadSchema>;

export const ProposalSourceSchema = z.enum(["mcp", "colar"]);

/** Proposta guardada na caixa. */
export type Proposal = {
  id: string;
  source: z.infer<typeof ProposalSourceSchema>;
  /** Nome legível da conexão de IA que propôs (ex.: "Claude"). */
  author: string;
  /** Concurso a que a proposta se refere. */
  examId: string;
  reason: string;
  payload: ProposalPayload;
  createdAt: number;
  expiresAt: number;
  status: "pendente" | "aplicada" | "descartada";
};

/** Entrada da ferramenta `propor_alteracoes` e do envio de resposta colada. */
export const ProposalInputSchema = z.strictObject({
  reason: z.string().trim().min(1).max(1000).describe("Por que propor estas alterações, em português."),
  payload: ProposalPayloadSchema,
});
export type ProposalInput = z.infer<typeof ProposalInputSchema>;

export const proposalExpiry = (createdAt: number) => createdAt + PROPOSAL_TTL_DAYS * 86_400_000;

export const isExpired = (proposal: Pick<Proposal, "expiresAt">, now = Date.now()) =>
  now >= proposal.expiresAt;

/** Bytes em UTF-8 da proposta serializada (sem depender de TextEncoder). */
export function proposalSize(input: unknown): number {
  let bytes = 0;
  for (const char of JSON.stringify(input) ?? "") {
    const code = char.codePointAt(0) ?? 0;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/** Prévia antes → depois de uma proposta. Lança erro se algo não existe nos dados. */
export function previewProposal(data: AppData, examId: string, payload: ProposalPayload): ChangePreview[] {
  if (payload.kind === "changes") return previewChanges(data, examId, payload.changes);
  const existing = new Map(
    subjectsInOrder(data, examId).map((s) => [s.name.toLocaleLowerCase("pt-BR"), s]),
  );
  return payload.syllabus.subjects.map((subject) => {
    const current = existing.get(subject.name.toLocaleLowerCase("pt-BR"));
    const topics = subject.topics.reduce((sum, t) => sum + 1 + (t.subtopics?.length ?? 0), 0);
    const currentTopics = current ? data.topics.filter((t) => t.subjectId === current.id).length : 0;
    return {
      title: current ? `Atualizar ${subject.name}` : `Nova matéria: ${subject.name}`,
      before: current ? `${currentTopics} assuntos` : "não existe",
      after: `${topics} assuntos no edital${subject.questions ? ` · ${subject.questions} questões` : ""}`,
    };
  });
}

/** Aplica a proposta pelas funções de domínio. */
export function applyProposal(data: AppData, examId: string, payload: ProposalPayload): AppData {
  if (payload.kind === "changes") return applyChanges(data, examId, payload.changes);
  return importSyllabus(data, examId, payload.syllabus);
}

/** Data local de expiração, para mostrar: "expira em 12 nov". */
export const expiryDate = (createdAtDate: string) => addDays(createdAtDate, PROPOSAL_TTL_DAYS);
