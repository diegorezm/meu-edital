# Desenvolvimento

Como o Meu Edital funciona por dentro e como rodar o projeto. Para as regras de trabalho no código, leia [AGENTS.md](../AGENTS.md). As decisões de arquitetura ficam em [decisions/](decisions/README.md).

## Como o estudo funciona

| Conceito | No app | O que é |
| --- | --- | --- |
| Concurso | Campanha | Nome, cargo, banca, data da prova e meta de horas por semana. Vários concursos, um ativo. |
| Matéria | Atributo | Disciplina do edital. Peso = `questões × pontos por questão`, um peso informado ou 1. |
| Assunto | — | Item do conteúdo programático, com subassuntos. Fica estudado quando tem uma sessão. |
| Ciclo | Jornada | Fila de blocos (matéria + minutos). Uma volta soma a meta semanal. Faltou um dia, a jornada espera. |
| Sessão | — | Registro de estudo: tipo (Teoria, Questões ou Revisão), minutos, questões, acertos e anotação. Pode ser corrigida ou excluída. |
| Revisão | — | Agendada no primeiro estudo de cada assunto (1, 7 e 30 dias). |
| Semana | — | De segunda a domingo, comparada com a meta salva no início da semana. |

O app responde a duas perguntas:

- **O que eu estudo agora?** O próximo bloco da jornada, com um assunto sugerido.
- **Como foi minha semana?** O tempo estudado contra a meta, por matéria e por dia.

## Tecnologia

Cloudflare Workers, D1 e Durable Objects. API em Hono, banco com Drizzle e auth com Better Auth. App em React 19, Vite, TanStack Router e Tailwind CSS v4. Site em Astro. App móvel com Capacitor. Monorepo com Bun e Turborepo, e testes com Vitest e Playwright.

## Executar

Requer Bun 1.4+ e Node 22+.

```bash
bun install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # e preencha BETTER_AUTH_SECRET
bun run dev     # http://localhost:5173 (aplica as migrações locais ao subir)
bun run check   # lint, typecheck e testes
```

Sem domínio de e-mail configurado, a conta é criada sem confirmação por e-mail e a recuperação de senha fica desligada.

O app móvel tem instruções próprias em [apps/mobile/README.md](../apps/mobile/README.md).

## Publicação

| Ambiente | App | Site |
| --- | --- | --- |
| Produção | https://meu-edital.diegommrez12.workers.dev | https://meu-edital-site.diegommrez12.workers.dev |
| Preview | https://meu-edital-preview.diegommrez12.workers.dev | https://meu-edital-site-preview.diegommrez12.workers.dev |

### Cadastro e lista de espera

A variável `SIGNUP_MODE` do `wrangler.jsonc` decide quem cria conta. Com `open` (local e preview), qualquer pessoa cria conta. Com `waitlist` (produção), o cadastro fica fechado: quem já tem conta entra, e os interessados deixam o e-mail na lista de espera (`POST /api/lista-de-espera`), pelo site ou pela tela de criar conta. O site mostra a lista quando é construído com `PUBLIC_WAITLIST=1`.

Para ler a lista:

```bash
cd apps/api
bunx wrangler d1 execute DB --remote --env production --command "select email, source, created_at from waitlist order by created_at"
```

Para abrir o cadastro, troque `SIGNUP_MODE` para `open` em `production`, tire o `PUBLIC_WAITLIST=1` do `deploy:production` do site e publique os dois.

### Publicação automática

Cada push na `main` que passa no CI publica a produção. Cada PR ganha uma versão de prévia. Os workflows precisam dos segredos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`.
