import { z } from "zod";
import { buildStudyContext } from "@meu-edital/agent-context";
import { createDb } from "@meu-edital/db";
import { loadAppData } from "../../data/proposals";
import { defineTool, text } from "../types";

/** Leitura: o retrato do estudo (StudyContext versionado, com nomes legíveis e sem ids). */
export const contextoDeEstudo = defineTool({
  name: "contexto_de_estudo",
  title: "Contexto de estudo",
  description:
    "Retrato do estudo do concurso ativo: matérias com peso, cobertura e aproveitamento, jornada (ciclo), últimas semanas contra a meta, revisões vencidas e sessões recentes. Use antes de propor alterações.",
  inputSchema: z.object({
    semanas: z.number().int().min(1).max(12).optional().describe("Quantas semanas de histórico (padrão 4)."),
    incluirAssuntos: z.boolean().optional().describe("Incluir a lista de assuntos de cada matéria (padrão sim)."),
  }),
  async run(args, { env, props }) {
    const data = await loadAppData(createDb(env.DB), props.userId);
    if (!data.activeExamId) return text("O estudante ainda não montou um concurso no app.", true);
    const context = buildStudyContext(data, data.activeExamId, {
      weeks: args.semanas,
      includeTopics: args.incluirAssuntos ?? true,
    });
    return text(JSON.stringify(context));
  },
});
