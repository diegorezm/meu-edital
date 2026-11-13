import { ChangeSchema } from "@meu-edital/agent-context";
import { createDb } from "@meu-edital/db";
import { z } from "zod";
import { ProposalError, proposalsData } from "../../data/proposals";
import { defineTool, text } from "../types";

/**
 * Proposta: nunca altera dados. Grava uma proposta pendente na caixa do
 * Oráculo e devolve o link para o estudante revisar e aplicar no app.
 */
export const proporAlteracoes = defineTool({
  name: "propor_alteracoes",
  title: "Propor alterações",
  description:
    "Propõe alterações no concurso ativo: matéria nova com assuntos (addSubject, com cycleMinutes para já entrar na jornada), peso de uma matéria (setSubjectWeight), meta de horas por semana (setHoursPerWeek) ou a jornada inteira (setCycle). As alterações valem em ordem, então um setCycle pode citar a matéria criada antes na mesma proposta. Nada é aplicado: a proposta vai para a caixa do Oráculo e o estudante decide. Use os nomes exatos das matérias do contexto_de_estudo. Para um concurso novo, use propor_concurso.",
  inputSchema: z.object({
    motivo: z.string().min(1).max(1000).describe("Por que propor isso, em português, curto."),
    alteracoes: z.array(ChangeSchema).min(1).max(30),
  }),
  async run(args, { env, props }) {
    try {
      await proposalsData(createDb(env.DB), props.userId).create(
        { reason: args.motivo, payload: { kind: "changes", changes: args.alteracoes } },
        { source: "mcp", author: props.clientName },
      );
      return text(
        `Proposta enviada para a caixa do Oráculo. O estudante vai revisar e decidir em ${env.APP_URL}/oraculo. Ela expira em 7 dias.`,
      );
    } catch (error) {
      if (error instanceof ProposalError) return text(error.message, true);
      throw error;
    }
  },
});
