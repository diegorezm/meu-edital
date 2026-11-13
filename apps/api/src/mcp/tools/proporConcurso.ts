import { NewExamSchema } from "@meu-edital/agent-context";
import { createDb } from "@meu-edital/db";
import { z } from "zod";
import { ProposalError, proposalsData } from "../../data/proposals";
import { defineTool, text } from "../types";

/**
 * Proposta de um concurso novo (edital inteiro). Como as outras, nunca altera
 * dados: o estudante confere a prévia na caixa do Oráculo e decide.
 */
export const proporConcurso = defineTool({
  name: "propor_concurso",
  title: "Propor concurso novo",
  description:
    "Propõe um concurso novo (edital) com matérias, assuntos e meta de horas por semana. Ao ser aceito, vira o concurso ativo e ganha uma jornada montada pelos pesos. Nada é criado agora: a proposta vai para a caixa do Oráculo e o estudante decide. Para acrescentar matérias ao concurso que já existe, use propor_alteracoes com addSubject.",
  inputSchema: z.object({
    motivo: z.string().min(1).max(1000).describe("Por que propor isso, em português, curto."),
    concurso: NewExamSchema,
  }),
  async run(args, { env, props }) {
    try {
      await proposalsData(createDb(env.DB), props.userId).create(
        { reason: args.motivo, payload: { kind: "exam", exam: args.concurso } },
        { source: "mcp", author: props.clientName },
      );
      return text(
        `Proposta de concurso enviada para a caixa do Oráculo. O estudante vai revisar e decidir em ${env.APP_URL}/oraculo. Ela expira em 7 dias.`,
      );
    } catch (error) {
      if (error instanceof ProposalError) return text(error.message, true);
      throw error;
    }
  },
});
