import { z } from "zod";
import type { AppData } from "@meu-edital/domain";
import { ChangeSchema } from "./changes";
import { buildStudyContext } from "./context";
import { parseWith } from "./parse";
import { SyllabusImportSchema } from "./syllabus";

/**
 * Uma tarefa descreve o que se pede a um agente externo: as instruções, o
 * recorte do contexto que ele recebe e o schema da resposta. O mesmo pacote
 * serve ao copiar e colar (via `renderPrompt`) e a uma API com saída
 * estruturada (via `taskRequest`).
 */
export type AgentTask<R> = {
  id: string;
  title: string;
  role: string;
  instructions: string[];
  context: (data: AppData, examId: string) => unknown;
  response: z.ZodType<R>;
  example: R;
};

export const WeeklyReviewSchema = z.strictObject({
  summary: z.string().min(1).max(2000).describe("Análise curta das últimas semanas, em português."),
  recommendations: z
    .array(z.string().min(1).max(500))
    .max(8)
    .describe("Ações concretas para a próxima semana."),
  changes: z
    .array(ChangeSchema)
    .max(30)
    .describe("Alterações propostas; vazio quando nada precisa mudar."),
});
export type WeeklyReview = z.infer<typeof WeeklyReviewSchema>;

export const syllabusTask: AgentTask<z.infer<typeof SyllabusImportSchema>> = {
  id: "importar-edital",
  title: "Importar edital",
  role: "Você extrai a estrutura de editais de concursos públicos brasileiros.",
  instructions: [
    "Analise o edital anexado ou colado nesta conversa.",
    "Extraia APENAS as matérias e os assuntos do cargo informado no contexto. Não invente conteúdo.",
    "Para cada matéria, inclua questions (número de questões) e pointsPerQuestion (pontos por questão) quando o edital informar ambos.",
    "Se o edital informar apenas um peso ou a pontuação total da matéria, use weight (número positivo).",
    "Omita questions, pointsPerQuestion e weight quando não constarem no edital; não estime.",
    "Cada matéria deve ter ao menos um assunto. Use subtopics para itens dentro de um assunto.",
    "Use em exam e role exatamente os nomes do contexto.",
  ],
  context: (data, examId) => {
    const exam = data.exams.find((item) => item.id === examId);
    return {
      exam: exam?.name,
      role: exam?.role,
      existingSubjects: data.subjects
        .filter((item) => item.examId === examId)
        .map((item) => item.name),
    };
  },
  response: SyllabusImportSchema,
  example: {
    exam: "Nome do concurso",
    role: "Cargo",
    subjects: [
      {
        name: "Português",
        questions: 10,
        pointsPerQuestion: 2,
        topics: [
          { name: "Interpretação de textos", subtopics: [{ name: "Tipos de texto" }] },
          { name: "Crase" },
        ],
      },
    ],
  },
};

export const weeklyReviewTask: AgentTask<WeeklyReview> = {
  id: "revisar-semana",
  title: "Revisar a semana",
  role: "Você é um mentor de estudos para concursos públicos que trabalha com ciclo de estudos.",
  instructions: [
    "Analise as semanas em weeks comparando minutes com targetMinutes, no total e por matéria. A semana com current=true ainda está em andamento.",
    "Considere o peso das matérias, a cobertura do edital (coverage), o aproveitamento nas questões (accuracy), as revisões vencidas e a data da prova.",
    "Escreva um resumo honesto e curto em summary e até 8 recomendações práticas em recommendations.",
    "Proponha alterações em changes apenas quando houver motivo claro, explicando-o em reason. Opções: setSubjectWeight, setHoursPerWeek e setCycle.",
    "Em setCycle, envie o ciclo completo na ordem desejada, intercalando matérias. Uma volta do ciclo deve somar aproximadamente hoursPerWeek.",
    "Use os nomes EXATOS das matérias do contexto. Não invente matérias.",
  ],
  context: (data, examId) => buildStudyContext(data, examId),
  response: WeeklyReviewSchema,
  example: {
    summary: "Você cumpriu 80% da meta, mas Matemática ficou abaixo do previsto.",
    recommendations: ["Comece a semana pelo bloco de Matemática."],
    changes: [
      { op: "setSubjectWeight", subject: "Matemática", weight: 3, reason: "Aproveitamento abaixo de 50%." },
    ],
  },
};

export const agentTasks = [syllabusTask, weeklyReviewTask] as const;

const jsonInstruction =
  "Responda somente com JSON válido dentro de um único bloco de código marcado como json (```json ... ```). Não escreva texto fora do bloco, comentários ou campos extras.";

/** Pedido para um provedor com API: mensagens e schema da saída estruturada. */
export function taskRequest<R>(task: AgentTask<R>, data: AppData, examId: string) {
  return {
    taskId: task.id,
    system: [task.role, ...task.instructions].join("\n"),
    context: task.context(data, examId),
    responseSchema: z.toJSONSchema(task.response),
  };
}

/** Pedido em texto para copiar e colar em qualquer IA. */
export function renderPrompt<R>(task: AgentTask<R>, data: AppData, examId: string) {
  const request = taskRequest(task, data, examId);
  return [
    `# Tarefa: ${task.title}`,
    task.role,
    "## Instruções",
    task.instructions.map((line) => `- ${line}`).join("\n"),
    `- ${jsonInstruction}`,
    "## Contexto",
    "```json",
    JSON.stringify(request.context),
    "```",
    "## Formato da resposta (JSON Schema)",
    "```json",
    JSON.stringify(request.responseSchema),
    "```",
    "## Exemplo de resposta",
    "```json",
    JSON.stringify(task.example),
    "```",
  ].join("\n\n");
}

export function parseTaskResponse<R>(task: AgentTask<R>, input: unknown): R {
  return parseWith(task.response, input);
}
