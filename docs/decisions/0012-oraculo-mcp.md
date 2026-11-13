# 0012 · Oráculo: servidor MCP remoto com OAuth do próprio app

**Contexto.** O estudante deve conectar a IA que já usa (Claude, ChatGPT ou outra com MCP remoto) sem copiar e colar, e o app não chama nenhuma API de IA paga.

**Escolha.**
- **Servidor MCP sem estado.** Fica em `/mcp` no mesmo Worker, usa Streamable HTTP e o `createMcpHandler` do pacote `agents`, com o SDK v2 (`@modelcontextprotocol/server`). O `McpAgent` (Durable Object) está obsoleto na documentação, e as ferramentas não precisam de sessão.
- **OAuth.** O `@cloudflare/workers-oauth-provider` (`OAuthProvider`) envolve o Worker. Ele atende `/mcp` com o token já validado e cuida de `/oauth/token`, `/oauth/register` (registro dinâmico) e da descoberta. O resto vai para o app Hono. Concessões e tokens ficam no KV `OAUTH_KV`.
- **Fluxo de autorização com o login do app.**
  1. `/authorize` valida o pedido.
  2. Sem sessão, manda para `/entrar?volta=...`.
  3. Com sessão, abre a consulta de consentimento da biblioteca (`beginConsent`) e manda para a tela do app `/conectar-ia`.
  4. A tela responde em `POST /oauth/consent`, que usa `approveConsent` ou `denyConsent` e depois `completeAuthorization`.
- **Escopos:** `estudo:ler` (ler o contexto) e `estudo:propor` (propor alterações). Não existe escopo de escrita.
- **Ferramentas:** uma por arquivo em `apps/api/src/mcp/tools/`, listadas em `tools/index.ts` com o escopo que cada uma exige.
  - `contexto_de_estudo` devolve o `StudyContext` versionado, sem ids.
  - `propor_alteracoes` valida com os schemas do `agent-context`, confere se as matérias citadas existem e grava uma proposta pendente. Ela nunca altera dados.
- **Caixa de propostas:** tabela `proposals`, fora do sync de linhas. As propostas expiram em 7 dias e têm no máximo 64 KB.
  - A resposta colada (copiar e colar) entra na mesma caixa por `POST /api/proposals`.
  - O app aplica uma proposta pelas funções de domínio (`applyProposal`) e pelo sync normal, e marca o resultado em `POST /api/proposals/:id/status`.
- **Conexões:** `GET /api/oraculo/conexoes` lista e `DELETE /api/oraculo/conexoes/:id` revoga. Revogar derruba o token na hora.
- **Limites:** rate limiting por usuário e conexão em `/mcp`, e por IP no consentimento.

**Pendências.**
- Criar os namespaces KV de `preview` e `production` no primeiro deploy (hoje com ids provisórios no `wrangler.jsonc`).
- A tela de consentimento e a caixa de propostas no app esperam a aprovação do desenho.

**Descartado.**
- `McpAgent`: obsoleto.
- Separar o servidor de autorização num Worker próprio: é o recomendado para vários servidores MCP, mas aqui há um só, e um Worker mantém a mesma origem e o login do app.
- Ferramenta que registra sessão: sessão vale XP, então tudo que vem da IA passa pela confirmação do estudante.
