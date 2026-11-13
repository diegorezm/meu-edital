import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler, getMcpAuthContext } from "agents/mcp/server";
import { createDb } from "@meu-edital/db";
import type { AppEnv } from "../env";
import { acceptancesData } from "../legal/acceptances";
import { TOOLS } from "./tools";
import type { McpProps } from "./types";

/**
 * Servidor MCP remoto (Streamable HTTP, sem estado). Cada requisição monta o
 * servidor com as ferramentas que os escopos concedidos permitem.
 */
function createServer(env: AppEnv, scopes: string[]) {
  return () => {
    const props = getMcpAuthContext()?.props as McpProps | undefined;
    const server = new McpServer({ name: "meu-edital-oraculo", version: "1.0.0" });
    if (!props) return server;
    for (const { tool, scope } of TOOLS) {
      if (!scopes.includes(scope)) continue;
      server.registerTool(
        tool.name,
        { title: tool.title, description: tool.description, inputSchema: tool.inputSchema },
        (args: unknown) => tool.run(args as never, { env, props }),
      );
    }
    return server;
  };
}

type OAuthContext = ExecutionContext & { props?: McpProps; auth?: { scope: string[] } };

/** Handler da rota /mcp, chamado pelo OAuthProvider já com o token validado. */
export const mcpApiHandler = {
  async fetch(request: Request, env: AppEnv, ctx: OAuthContext): Promise<Response> {
    const props = ctx.props;
    if (!props) return new Response("Não autorizado.", { status: 401 });
    const { success } = await env.API_LIMITER.limit({ key: `mcp:${props.userId}:${props.clientName}` });
    if (!success) return new Response("Muitas chamadas. Espere um minuto.", { status: 429 });
    const pending = await acceptancesData(createDb(env.DB), props.userId).pending();
    if (pending.length > 0)
      return new Response("Abra o Meu Edital e aceite os termos atualizados para continuar.", {
        status: 403,
      });
    const handler = createMcpHandler(createServer(env, ctx.auth?.scope ?? []), {
      route: "/mcp",
      authContext: { props },
    });
    return handler(request, env, ctx);
  },
};
