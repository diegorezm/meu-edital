# AGENTS.md

Como trabalhar neste repositório. Para o que o app é (conceitos, regras de produto), leia [docs/desenvolvimento.md](docs/desenvolvimento.md). O plano completo da reconstrução está em [docs/prompt-reconstrucao.md](docs/prompt-reconstrucao.md), e as decisões de arquitetura ficam em [docs/decisions/](docs/decisions/README.md).

## Visão geral

Monorepo com Bun workspaces e Turborepo. Tudo roda na Cloudflare: um Worker (Hono) serve a API em `/api/*` e o app web como static assets, na mesma origem.

| Caminho | Pacote | O que vai lá |
| --- | --- | --- |
| `apps/web` | `@meu-edital/web` | SPA React 19 + Vite + TanStack Router. |
| `apps/mobile` | `@meu-edital/mobile` | Casca Capacitor (Android; iOS num Mac). Ver `apps/mobile/README.md`. |
| `apps/api` | `@meu-edital/api` | Worker Hono: auth (Better Auth), dados, e depois sync, exportação e MCP. |
| `packages/domain` | `@meu-edital/domain` | Modelos e regras de estudo, puros. Depois, a gamificação. |
| `packages/agent-context` | `@meu-edital/agent-context` | `StudyContext`, tarefas e propostas para IA externa (Zod). |
| `packages/sync` | `@meu-edital/sync` | Protocolo de sync: schemas das linhas, `diffData`, `applyPulled` e o `SyncEngine`. |
| `packages/db` | `@meu-edital/db` | Schema Drizzle e migrações do D1. |
| `packages/ui` | `@meu-edital/ui` | Design system: tema Tailwind, componentes e arte (`art/`). |
| `docs/design-system` | — | Referência visual (tokens, componentes, mockups). Não é código. |

Pacotes são consumidos como TypeScript, sem build (`main: ./src/index.ts`).

Dependências entre pacotes:
- `domain` não importa nada.
- `agent-context` depende só de `domain` e Zod.
- `db` (e, depois, `sync`) depende de `domain`.
- Os apps dependem dos pacotes.

`domain`, `agent-context` e `sync` não importam React, DOM nem Capacitor.

## Comandos

Rode na raiz. O Bun só instala pacotes e roda scripts; não use `bun test`.

```bash
bun install
bun run check            # lint + typecheck + testes em todos os pacotes (definição de pronto)
bun run --cwd apps/web build             # app web em apps/web/dist
bun run dev                              # Worker (:8787) + Vite (:5173); use http://localhost:5173
bun run --cwd apps/api dev               # só o Worker, servindo o build de apps/web/dist em :8787
bun run --cwd apps/api db:migrate:local  # aplica as migrações no D1 local
bun run e2e                              # fluxo principal no Playwright (sobe o Worker local)
bun run deploy:preview                   # build do app + migrações + deploy em preview
```

Banco:
- Para mudar o schema, edite `packages/db/src/schema.ts` e rode `bun run --cwd packages/db generate -- --name <descricao>`.
- Nunca edite uma migração já aplicada.
- Depois de mudar `wrangler.jsonc`, rode `bun run --cwd apps/api types`. O typecheck confere se `worker-configuration.d.ts` está atualizado.

Segredos locais ficam em `apps/api/.dev.vars`; copie de `.dev.vars.example`. Em `preview` e `production`, use `bunx wrangler secret put <NOME> --env <ambiente>`. Nunca coloque segredo no repositório.

Antes de escrever código que toque em Workers, D1, Durable Objects ou Wrangler, consulte a documentação atual (https://developers.cloudflare.com/llms.txt). Para o Better Auth, use https://better-auth.com/docs/llms.txt.

## Regras do domínio (não quebre)

- **O estudo é cíclico.** O ciclo é a única fonte de "o que estudar agora". Não existe plano dia a dia.
- Uma volta do ciclo soma a meta semanal (`weeklyAllocation`). Mudanças na alocação só com testes.
- O aproveitamento usa as últimas 6 semanas (`ACCURACY_WINDOW_DAYS`).
- O assunto é escolhido por sessão (`suggestNextTopic`).
- `recordSession` é a única forma de salvar estudo. `updateSession` e `deleteSession` corrigem e desfazem os efeitos (ver [0007](docs/decisions/0007-excluir-sessao.md)).
- "Estudado" é derivado das sessões; não existe campo `studied`.
- A meta de uma semana passada vem do retrato salvo (`ensureWeekTarget`, `weekTargetFor`).
- Datas são strings locais `AAAA-MM-DD`. Nunca use `toISOString()` para datas.
- Ids vêm de `uid()` (UUIDv7). A ordem vem de `position` e `order`, nunca do id.
- Funções de domínio são puras: `(data, ...) => data`, sem mutação e sem I/O.
- No código, os nomes são os do domínio (`cycle`, `session`, `review`). Os nomes de RPG (Jornada, Contratos, Guilda, Oráculo) existem só nos textos da interface.

## API e segurança

- Rotas de dados usam `requireUser` (`apps/api/src/http/session.ts`) e acessam o banco só por `userData(db, userId)` (`apps/api/src/data/access.ts`). Nenhuma consulta usa `user_id` vindo do cliente.
- Cada rota nova ganha um teste que tenta ler ou alterar dados de outro usuário.
- A auth aceita cookie (web) e `Authorization: Bearer` (app mobile).
- Rate limiting pelos bindings `AUTH_LIMITER` e `API_LIMITER`.
- Resposta de IA é dado não confiável: valide com o schema de `agent-context`, mostre a prévia e aplique só com confirmação.
- Sync: `POST /api/sync/push`, `GET /api/sync/pull?since=`, `GET /api/sync/ws` (avisos pelo Durable Object `UserHub`). Detalhes em [0010](docs/decisions/0010-protocolo-de-sync.md).
- Testes da API rodam no runtime de Workers (`@cloudflare/vitest-plugin`) com D1 local. Os e-mails ficam em `outbox` (modo `memory`).

## App web

- Rotas em `src/routes/` (roteamento por arquivo do TanStack Router; `routeTree.gen.ts` é gerado). A rota só monta a página exportada pela feature.
- Uma pasta por tela em `src/features/<feature>/`:
  - `hooks/` têm estado e ações, sem JSX;
  - `components/` só desenham;
  - `index.tsx` é a entrada pública.
- Uma feature não importa o interior de outra.
- Dados de estudo: `useStore()` (`src/global/store/`). Leia `store.data` e altere só com `store.update((data) => funcaoDeDominio(data, ...))`; o sync cuida do resto. Nunca chame a API de sync direto de uma tela.
- Chamadas à API passam por `apiFetch`/`apiUrl` (`src/global/http.ts`): na web são relativas com cookie; no app nativo usam `VITE_API_ORIGIN` e o token bearer.
- Código compartilhado fica em `src/global/`. Recursos de plataforma (armazenamento seguro, notificações, vibração, e depois o cronômetro) ficam atrás de `src/platform/`. Telas nunca verificam a plataforma.
- Aliases: `@features/*`, `@global/*`, `@platform/*`. Importações externas primeiro.
- Nenhum arquivo de tela com mais de ~300 linhas.
- Cronômetro: `global/timer/` (estado em `platform.preferences`, título da aba e aviso de fim no `TimerTicker`). Comemorações: `celebrationStore.show(...)` depois de registrar estudo.

## UI

- O design está em `docs/design-system/`: leia `design-system.md` e abra `index.html` e `docs/mockups/dashboard-rpg.html`.
- Use os componentes de `@meu-edital/ui`. Nenhuma cor ou medida solta: só os tokens do tema (`packages/ui/src/theme.css`).
- Mudar uma cor exige passar no teste de contraste (`packages/ui/tests/contrast.test.ts`).
- Arte pela chave do manifesto (`<Art name="mascote.rosa.parado" />`), nunca pelo caminho.
- Fontes servidas pelo próprio app (Fontsource), sem CDN.
- Desktop e celular são desenhos diferentes. Confira as duas larguras antes de dar uma tela por pronta.
- **Telas novas precisam de desenho aprovado antes de serem construídas.** Proponha com os componentes existentes.
- Textos em português do Brasil, curtos e amigáveis, sem emoji e sem culpa por ausência.
- Respeite `prefers-reduced-motion`. Foco sempre visível. Área de toque de pelo menos 44 px.

## Git

- Trabalhe em branches. Commits só quando pedirem.
- Mensagens de commit em português, no presente e em terceira pessoa: `Adiciona exclusão de sessão no domínio`.
- Nunca faça commit de `.dev.vars`, `.env*`, `dist/`, `.turbo/` ou `.wrangler/`.
