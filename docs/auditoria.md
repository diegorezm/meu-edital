# Auditoria técnica — Status e pendências

Levantamento completo do monorepo realizado em 2026-11-25, cobrindo domínio, sync, banco (D1), API/segurança, frontend web, design system, app mobile, site, testes e CI/CD.

## Resumo dos PRs (stack)

| Camada | Branch | Base | PR | Escopo |
| --- | --- | --- | --- | --- |
| **P0** | `fix/p0-sync-dominio` | `main` | [#1](https://github.com/diegorezm/meu-edital/pull/1) | Segurança da API, sync/D1, `LegalGate` e estabilidade de testes |
| **P1** | `fix/p1-estabilidade-escala` | `fix/p0-sync-dominio` | [#5](https://github.com/diegorezm/meu-edital/pull/5) | Índices D1, cron sem N+1, domínio/Oráculo, PWA offline, timer, bundle e CI |
| **P2** | `feat/p2-mobile-site-a11y-ux` | `fix/p1-estabilidade-escala` | [#6](https://github.com/diegorezm/meu-edital/pull/6) | Acessibilidade, `SyncBanner`, UX/Edital, Android, site e testes |
| **P3** | `feat/p3-refinos-backlog` | `feat/p2-mobile-site-a11y-ux` | *nesta branch* | Quotas D1, tombstones, LGPD export completo, `useQuery` no legal, `<h1>`, tokens, SEO/JSON-LD e `sitemap.xml` |

---

## O que já foi feito

### P0 — Segurança, integridade de dados e sync ([#1](https://github.com/diegorezm/meu-edital/pull/1))
- [x] **D1 / Sync (servidor):** chunking de `inArray` em `alreadyApplied` e `foreignIds`; `pull()` em `db.batch()` único; proteção contra pushes concorrentes duplicados via PK de `sync_mutations` + retry atômico; recusa de `delete` em `userSettings`; `bodyLimit` em `/api/sync/push` e `/api/proposals`; validação de `Origin` em `/api/sync/ws`; `setWebSocketAutoResponse("ping", "pong")` e `destroy()` no `UserHub`.
- [x] **Sync (cliente) e domínio:** validação de datas (`isDateKey` 1970–2100), `correct <= questions`, `mockExams.questions >= 1` e `parentId !== id` nos `rowSchemas`; `topicTreeIds` protegido contra ciclos; `playerXp` sem XP para acertos sem questões; `sessionsCsv` protegido contra CSV Formula Injection; `dataFromRows` respeitando `version`; `SyncClient` protegido contra `dispose()`, loop infinito na paginação, desaparecimento na UI quando `pull` falha após `push` e `status: "error"`; `transport.ts` tratando `500`/`401` como retentáveis; fallback de fila em `nativeSync.ts` isolado por `userId`.
- [x] **Segurança (Auth, OAuth, Web Push, Headers, CORS):** `disableSignUp` no Google OAuth; `afterDelete` no `deleteUser` revogando grants em `OAUTH_KV`, destruindo `UserHub` e limpando `verification`; Web Push com HTTPS + base64url, limite de 10 assinaturas/usuário, bloqueio cross-tenant (`409` + `setWhere`), timeout de 5s e `try/catch` isolado; rate limit em `/oauth/register`, `/oauth/token` e `/authorize`; fallback de escopo OAuth restrito a `["estudo:ler"]`; rate limit MCP por `userId`; `DELETE /api/oraculo/conexoes/:id` sem `requireConsent`; `rateLimit` antes de `requireConsent`; `secureHeaders()` nas rotas OAuth e correção do bypass por `Upgrade`; CORS de `SITE_URL` restrito a `/api/config` e `/api/lista-de-espera` com `credentials: false`; `apps/web/public/_headers` (CSP, HSTS, `X-Frame-Options: DENY`).
- [x] **Frontend P0 e testes:** `LegalGate` libera `/conta`; `StoreProvider` com tratamento de erro e retry; `deleteAccount` e `signOut` limpam `timerStore` e token salvo; isolamento de IP em `oraculo.test.ts` e correção do flake de virada de minuto em `auth.test.ts`.

### P1 — Escala, domínio, PWA offline, cronômetro e CI ([#5](https://github.com/diegorezm/meu-edital/pull/5))
- [x] **D1, Backend e Cron:** migração `0009_indices_e_constraints.sql` com 10 índices/constraints; cron `sendDueReviewReminders` em 1 consulta agregada (fim do N+1) com concorrência limitada; `runHousekeeping()` diário removendo `pruneMutations()` de `push`; `loadAppData()` em `db.batch()` filtrando `deleted_at IS NULL`; `proposals.setStatus()` checando expiração; `trackingData` com `LIMIT` e deduplicação; `acceptances.ts` com HMAC-SHA256 e `onConflictDoNothing`; `waitlistRoutes` com timeout/`try/catch`; ticket efêmero HMAC (`POST /api/sync/ws-ticket`) no WebSocket; limite de 15 sockets e `webSocketError` no `UserHub`; `/api/health` validando D1 (`SELECT 1`); `trustedOrigins` cobrindo `pr-*-*preview*`.
- [x] **Domínio, Oráculo e Sync Client:** correções de `cyclePosition`/`lastCycleSessionId`; `recordSession` tratando primeira sessão `"Revisão"`; `updateSession` validando entradas e sem deslocar revisões concluídas; alinhamento de validações; `weakestSubject` ignorando sessões do dia; pureza de datas; `monthSummary` com comparador estável; otimizações O(N) em `allocation.ts`, `topics.ts`, `weeksWithGoal` e `weeklyStreak`; validação/limites/escape em `packages/agent-context` + `extractJson` resiliente; cache por tabela e batch de notificações no `SyncClient`.
- [x] **Frontend Web, PWA Offline, Cronômetro, Nativo e Bundle:** Service Worker com cache seguro do app shell + registro automático + fallback de sessão offline; `useStudy`/`useMockExams` sem stale closure nem duplo submit, amarrando `examId` ao timer e confirmação ao descartar; sincronização do cronômetro entre abas (`storage`) e `visibilitychange`; `useOracle.settle` confirmando status no servidor antes de aplicar e usando `apiUrl("/mcp")`; `StoreProvider` com `beforeunload` e `sync()` ao reconectar WS; `ErrorBoundary` e 404 em `__root.tsx`; tratamento de erro em `SignUpPage`; correções de formulários e `<Link to>` interno; imports dinâmicos (`browserSync`/`nativeSync`/`nativeShell`) e subsets `latin`/`latin-ext` do Fontsource; conformidade `AGENTS.md` (`useNotifications`, `ReviewReminders`, `useConsent`, `useAccount`, `useOnboarding`); `native.ts` com guard `isAndroid()`, cancelamento completo em `push.unsubscribe()` e checagem de `avisos` em `blockEnd.schedule()`.
- [x] **CI/CD:** `permissions` mínimos, build de `apps/web` e `apps/site` no CI, guarda contra forks + `preview_urls: true` (em `env.preview`) + proteção contra comentário vazio em `deploy-preview.yml`, filtro `event == 'push'` e smoke test `/api/health` em `deploy-production.yml`.

### P2 — Acessibilidade, UX, Android, site e testes ([#6](https://github.com/diegorezm/meu-edital/pull/6))
- [x] **Acessibilidade e UI:** área mínima de toque de 44 px em `Chip`, `NavItem`, `PerformanceView` e `MockExamsView`; anel `:focus-visible` de alto contraste; skip-link e `<main id="conteudo">` em `AppShell`; `aria-expanded`/`aria-haspopup` no menu "Mais".
- [x] **UX:** `SyncBanner` global no `AppShell`; exportação LGPD via `apiFetch` + blob (`downloadExport`); empty states com CTA para `/comecar`; reordenação de matérias/assuntos no mobile + busca de assuntos em `SubjectPanel`; card "Chefe" clicável para `/simulados`.
- [x] **Mobile Android:** `android:allowBackup="false"`, `custom_url_scheme` = `meuedital`, `ic_launcher_background` = `#C2A09A`, `StudyTimerPlugin` com `handleOnDestroy()` e `try/catch` em `startForegroundService`, `StudyTimerService` atualizando notificação ao pausar e `try/catch` em `loadSessionToken()`.
- [x] **Site (`apps/site`):** `robots.txt`, `site` no `astro.config.mjs`, `canonical`, Open Graph, `twitter:card`, skip-link, `<nav>`, página `/termos/`, `summary` >= 44 px, erro visível e validação de e-mail em `Waitlist.astro`.
- [x] **Testes:** cobertura de `extractJson`, `renderPrompt`, `removeSubject`, `recordMockExam` e `inFinalStretch`.

### P3 — Refinos do backlog técnico (`feat/p3-refinos-backlog`)
- [x] **Backend e D1:** quotas de registros ativos por conta em `sync.ts` e limite de 50 propostas pendentes em `proposals.ts`; compactação de tombstones (> 180 dias) no `runHousekeeping()`; rate limit secundário por e-mail em `POST /api/auth/sign-in/email`; `OAuthProvider` cacheado por `runtimeEnv.APP_URL`; logs estruturados em JSON nos erros 5xx e cron; export JSON completo para LGPD (`concursoAtivo`, `comemoracoesVistas`, dados cadastrais `conta`, `aceitesLegais` e `consentimentos`).
- [x] **Sync e WebSocket:** `firstPull()` não bloqueia `ready` pela rede quando o banco local já está hidratado (`cursor() > 0`); `listenForChanges` interrompe loop de reconexão WS se a sessão expirou (`1008`/`4401` ou checagem em `/api/auth/get-session`).
- [x] **Frontend, UI e Nativo:** `useCookieBanner` e `useLegalGate` migrados para `useQuery`; `ReviewReminders` reage à troca do toggle de avisos (`["push", "assinatura"]`); `apiFetch` valida `VITE_API_ORIGIN` no build nativo; `useSignIn` usa `apiUrl(back)` para `/authorize`; `AppShell`/`usePlayer` reutilizam `user.name` do `Route.useRouteContext()` (sem `useSession()` redundante); `AccountPage` carregada com `React.lazy` (fora do bundle das rotas públicas); `Sheet` com `headingLevel="h1"` nas telas internas; migração de `rgb(...)` e raios arbitrários (`rounded-control`, `rounded-chip`, `rounded`) para tokens em `packages/ui/src/theme.css`.
- [x] **Site e documentação:** `apps/site/src/pages/sitemap.xml.ts`, `Sitemap:` em `robots.txt`, JSON-LD (`SoftwareApplication` + `FAQPage`) em `index.astro`, subsets `latin`/`latin-ext` do Fontsource em `site.css`; atualização de `docs/decisions/0012-oraculo-mcp.md` e troca de "Configurações" por "Conta" em `docs/legal/`.

---

## O que falta fazer (pausado ou aguardando decisão sua)

### 1. Deploy, domínio e custos externos — *pausado até validar demanda / público interessado*
- [ ] **Domínio próprio e envio real de e-mail:** trocar `*.diegommrez12.workers.dev` e integrar provedor real em `apps/api/src/auth/mailer.ts` (`EMAIL_MODE` continua `"log"` sem custo).
- [ ] **Preencher placeholders jurídicos** em `docs/legal/privacidade.md` e `docs/legal/termos.md` (`[nome]`, `[CPF/CNPJ]`, `[e-mail do encarregado]`, etc.) e unificar `apps/site/src/pages/privacidade.astro` com `docs/legal/privacidade.md`.
- [ ] **Integrações opcionais:** credenciais de Google OAuth e provedores de erro/análise em `apps/web/src/platform/tracking/index.ts` (ou ocultar o banner enquanto `PROVIDERS` estiver vazio).
- [ ] **Publicação mobile:** ícones/splash PNG do Meu Edital + keystore/R8 + justificativa `specialUse` / `POST_NOTIFICATIONS` / App Links / OAuth em Chrome Custom Tabs no Android, e criação do projeto iOS em Mac/Xcode.
- [ ] **Backup pré-migração em produção** no `.github/workflows/deploy-production.yml` e primeiro `bun run deploy:preview` para ativar URLs `pr-<N>-meu-edital-preview...`.

### 2. Novas telas e recursos de produto — *exigem desenho aprovado conforme `AGENTS.md`*
- [ ] **Conta (`/conta`):** editar nome, trocar e-mail, trocar senha logado e importar backup JSON.
- [ ] **Edital (`/edital`):** filtro de assuntos estudados/pendentes e importação em lote.
- [ ] **Histórico (`/semana`):** busca nas anotações, filtro por matéria/tipo e visão contínua.
- [ ] **Simulados (`/simulados`):** edição de simulado, fator de correção (Cebraspe) e nota ponderada/discursiva.
- [ ] **Cronômetro (`/estudar`):** modo Pomodoro/pausas, som opcional de fim de bloco e atalhos de teclado.
- [ ] **Guilda:** decidir entre implementar ou ocultar/sinalizar melhor enquanto estiver em construção.
- [ ] **Toasts de feedback:** toasts leves para confirmações de salvamento (`onBlur`, copiar no `OracleView` mobile).

### 3. Melhorias pontuais só se/quando houver escala real
- [ ] Avaliar PK composta `(user_id, id)` + `UUID_PATTERN` em `packages/sync/src/tables.ts` e streaming/compactação em `GET /api/export`.
- [ ] Ampliar E2E (`e2e/`) apenas para fluxos críticos quando novas telas entrarem (sem inflar testes unitários desnecessários).
