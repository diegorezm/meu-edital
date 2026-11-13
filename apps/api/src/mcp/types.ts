import type { z } from "zod";
import type { AppEnv } from "../env";

/** O que a autorização guarda e cada chamada MCP recebe. */
export type McpProps = { userId: string; clientName: string };

export type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

/**
 * Uma ferramenta do Oráculo. Acrescentar uma é criar um arquivo em
 * `tools/` e listá-lo em `tools/index.ts`. Nenhuma ferramenta escreve nos
 * dados do estudante: no máximo grava uma proposta pendente.
 */
export type McpTool<S extends z.ZodType = z.ZodType> = {
  name: string;
  title: string;
  description: string;
  inputSchema: S;
  run(args: z.infer<S>, ctx: { env: AppEnv; props: McpProps }): Promise<ToolResult>;
};

export const text = (value: string, isError = false): ToolResult => ({
  content: [{ type: "text", text: value }],
  ...(isError ? { isError } : {}),
});

/** Define uma ferramenta com os argumentos tipados pelo próprio schema. */
export const defineTool = <S extends z.ZodType>(tool: McpTool<S>) => tool as unknown as McpTool;
