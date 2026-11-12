# 0001 · Monorepo com Bun workspaces e Turborepo

**Contexto.** O projeto tem app web, API, site e pacotes de regras compartilhados.

**Escolha.**
- Bun workspaces instala as dependências e roda os scripts.
- Turborepo orquestra `lint`, `typecheck`, `test` e `build`.
- Os pacotes são consumidos como TypeScript, sem build (`main: ./src/index.ts`).
- O Bun não é runtime: em produção tudo roda no workerd.
- Os testes usam Vitest em todos os pacotes, porque `bun test` não roda no runtime de Workers.
- O linker do Bun é `hoisted` (`bunfig.toml`), para o Vite e o plugin de testes da Cloudflare acharem as dependências sem configuração extra.
- O TypeScript fica na 6.0, porque o `typescript-eslint` ainda não suporta a 7.

**Descartado.**
- npm workspaces: mais lento, e já era o do projeto antigo.
- pnpm: não traz ganho que justifique mais uma ferramenta.
- Linker isolado do Bun: quebra a resolução de alguns plugins.
