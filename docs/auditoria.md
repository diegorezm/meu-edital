# Auditoria técnica e backlog de melhorias

Levantamento completo do monorepo realizado em 2026-11-25, cobrindo domínio, sync, banco (D1), API/segurança, frontend web, design system, app mobile, site, testes e CI/CD.

---

## O que já foi resolvido (P0 + P1 de código)

### P0 (`fix/p0-sync-dominio`)
- **D1 / Sync (servidor):** chunking de `inArray` em `alreadyApplied` e `foreignIds` (evita estouro do limite de 100 parâmetros do D1 em lotes > 100); `pull()` em `db.batch()` único (snapshot consistente); proteção contra pushes concorrentes duplicados via PK de `sync_mutations` + retry atômico; recusa de `delete` em `userSettings`; `bodyLimit` real em `/api/sync/push` e `/api/proposals`; validação de `Origin` em `/api/sync/ws`; `setWebSocketAutoResponse("ping", "pong")` no `UserHub`.
- **Sync (cliente) e domínio:** validação real de datas (`isDateKey` + faixa 1970–2100), `correct <= questions`, `mockExams.questions >= 1` e `parentId !== id` nos `rowSchemas`; `topicTreeIds` protegido contra ciclos; `playerXp` sem XP para acertos sem questões; `sessionsCsv` protegido contra CSV Formula Injection; `dataFromRows` respeitando `version`; `SyncClient` protegido contra `dispose()`, loop infinito na paginação, desaparecimento na UI quando `pull` falha após `push`, e `status: "error"` em erro não-offline; `transport.ts` tratando `500` e `401` como retentáveis (sem apagar estudo offline); fallback de fila no `nativeSync.ts` isolado por `userId`.
- **Segurança (Auth, OAuth, Web Push, Headers, CORS):** `disableSignUp` no Google OAuth (fecha bypass de `waitlist`); `afterDelete` no `deleteUser` revogando grants em `OAUTH_KV`, destruindo `UserHub` e limpando `verification`; Web Push exigindo HTTPS + base64url, limite de 10 assinaturas/usuário, bloqueio de sobrescrita cross-tenant (`409` + `setWhere`), timeout de 5s e `try/catch` isolado por assinatura/usuário; rate limit em `/oauth/register`, `/oauth/token` e `/authorize`; fallback de escopo OAuth restrito a `["estudo:ler"]`; rate limit MCP por `userId` (sem `clientName`); `DELETE /api/oraculo/conexoes/:id` liberado sem `requireConsent`; `rateLimit` antes de `requireConsent`; `secureHeaders()` nas rotas OAuth e correção do bypass por header `Upgrade`; CORS de `SITE_URL` restrito a `/api/config` e `/api/lista-de-espera` com `credentials: false`; criação de `apps/web/public/_headers` (CSP, HSTS, `X-Frame-Options: DENY`).
- **Frontend P0:** `LegalGate` deixa acessar `/conta` para exportar ou excluir a conta; `StoreProvider` com tratamento de erro e retry (sem travar no skeleton); `deleteAccount` e `signOut` limpando `timerStore` e token salvo.

### P1 (`fix/p1-estabilidade-escala`)
- **D1, Backend e Cron:** migração `0009_indices_e_constraints.sql` com 10 índices/constraints (`reviews_user_exam_due_idx`, `legal_acceptances_user_doc_ver_uidx`, `tracking_consents_user_decided_idx`, `proposals_*`, `session/verification_expires_idx`, `account_provider_account_idx`, `user_settings_user_uidx`); cron `sendDueReviewReminders` refatorado para 1 consulta agregada (fim do N+1) com despacho concorrente limitado; `runHousekeeping()` diário (sessões, verificações, `sync_mutations` antigas e propostas expiradas) removendo `pruneMutations()` do caminho quente de `push`; `loadAppData()` direto em 1 `db.batch()` filtrando `deleted_at IS NULL`; `proposals.setStatus()` checando expiração; `trackingData` com `LIMIT` e deduplicação; `acceptances.ts` com HMAC-SHA256 e `onConflictDoNothing`; `waitlistRoutes` com timeout/try-catch no Turnstile; ticket efêmero HMAC (`POST /api/sync/ws-ticket`) no WebSocket; limite de 15 sockets e `webSocketError` no `UserHub`; `/api/health` validando D1 (`SELECT 1`); `trustedOrigins` para preview aliases `pr-*`.
- **Domínio, Oráculo e Sync Client:** correções de `cyclePosition`/`lastCycleSessionId` em `addCycleItem`/`moveCycleItem`/`removeCycleItem`/`removeSubject`/`removeTopicTree`; `recordSession` tratando primeira sessão `"Revisão"`; `updateSession` validando entradas e sem deslocar revisões concluídas; alinhamento de validações (`validateSession`, `updateExam`, `updateSubject`, `recordMockExam`); `weakestSubject` ignorando sessões do próprio dia; pureza de datas em `weekSummary`/`weekHistory`/`weekTargetFor`/`buildCycle`; otimizações O(N) em `allocation.ts` (com doador de maior carga), `topics.ts`, `weeksWithGoal` e `weeklyStreak`; validação e peso padrão em propostas `syllabus`, limites de array/valor, escape de ```` ``` ```` em `renderPrompt` e `extractJson` resiliente; cache por tabela e batch de notificações no `SyncClient`.
- **Frontend Web, PWA Offline, Timer e Bundle:** Service Worker com cache seguro do app shell (nunca cacheando `/api/*`) + registro automático + fallback de sessão offline em `guards.ts`; `useStudy`/`useMockExams` sem stale closure nem duplo submit, amarrando `examId` do timer e confirmação ao descartar; sincronização do cronômetro entre abas (`storage`) e `visibilitychange`; `useOracle.settle` confirmando status no servidor antes de aplicar e usando `apiUrl("/mcp")`; `StoreProvider` com `beforeunload` e `sync()` ao reconectar WS; `ErrorBoundary` e 404 em `__root.tsx`; tratamento de erro de `/api/config` em `SignUpPage`; `useSubmit` com `catch` e anti-duplo-clique; correções de formulários (`JourneySheets`, `SessionForm`, `ReviewsView`, `SubjectPanel`, `Turnstile`, `useSyllabus`, `useSignUp`); `<Link to>` interno; imports dinâmicos para `browserSync`/`nativeSync`/`nativeShell` e subsets `latin`/`latin-ext` do Fontsource; `useNotifications` e `ReviewReminders` sem checar `platform.native`, `useConsent` via `apiFetch`, `useAccount` via `useSyncState` e `useOnboarding` via `useStoreActions`.
- **CI/CD:** `permissions` mínimos, build de `apps/web` e `apps/site` no CI, guarda contra forks em `deploy-preview.yml`, filtro `event == 'push'` e smoke test `/api/health` em `deploy-production.yml`.

---

## 1. Pendências de produção (configuração, domínio e jurídico)

- **Domínio próprio e envio real de e-mail (`apps/api/wrangler.jsonc`, `apps/api/src/auth/mailer.ts`):**
  - Produção ainda roda em `*.diegommrez12.workers.dev` com `EMAIL_MODE: "log"`.
  - Implementar provedor real no `mailer.ts` (Resend, SES, Postmark etc.) para habilitar verificação de e-mail e recuperação de senha em produção.
- **Finalizar documentos legais (`docs/legal/privacidade.md`, `docs/legal/termos.md`):**
  - Substituir placeholders visíveis no app (`[nome completo ou razão social]`, `[CPF/CNPJ]`, `[nome]`, `[e-mail do encarregado]`, `[e-mail de contato]`, `[Confirmar quando for configurado.]`, `[Reservado para quando houver cobrança: ...]`).
  - Trocar referências a **"Configurações"** por **"Conta"** (`/conta`).
  - Decidir juridicamente se `legal_acceptances` e `tracking_consents` devem manter `ON DELETE CASCADE` ao excluir a conta ou preservar prova anonimizada.
- **Google OAuth e Rastreamento:**
  - Configurar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` se o login com Google for ficar ativo.
  - Em `apps/web/src/platform/tracking/index.ts`, `PROVIDERS` está vazio (`[]`) enquanto o banner já pede consentimento para `erros` e `analise` — plugar os provedores escolhidos ou ocultar o banner até existirem.
- **Atualizar ADR `docs/decisions/0012-oraculo-mcp.md`:** ainda descreve KV provisório e telas de consentimento/propostas como pendentes, mas já estão em produção.

---

## 2. Prioridade Alta (P1) — Estabilidade, Escala e Offline Real

### 2.1 Backend, D1 e Durable Objects
- **Refatorar cron `sendDueReviewReminders` (`apps/api/src/push/reminders.ts`):**
  - Hoje faz N+1 severo: chama `loadAppData()` (10 queries carregando todas as 9 tabelas + tombstones) *para cada usuário* com push.
  - Substituir por 1 query SQL agregada juntando `push_subscriptions`, `user_settings` e `reviews` (`deleted_at IS NULL AND completed_by_session_id IS NULL AND due_date <= ? AND exam_id = active_exam_id`), e despachar pushes com concorrência limitada (ou Cloudflare Queues).
- **Otimizar `loadAppData()` (`apps/api/src/data/proposals.ts`):**
  - Hoje usa `sync.pull()`, lendo tombstones (`deleted_at IS NOT NULL`) que são descartados depois. Criar leitura direta em `db.batch()` filtrando `deleted_at IS NULL`.
- **Índices e constraints no D1 (`packages/db/src/schema.ts` + nova migração):**
  - `reviews(user_id, exam_id, due_date)` para o cron de revisões.
  - `UNIQUE(user_id, document, version)` em `legal_acceptances` (evita duplicatas em corrida).
  - `tracking_consents(user_id, decided_at, id)` + `LIMIT` em `trackingData.latest()` e deduplicação em `save()`.
  - `sync_mutations(user_id, applied_at)` (ou mover `pruneMutations` de todo `push` para o cron diário).
  - `proposals(user_id, status, expires_at)` e índice em `expires_at`; checar `expiresAt > now` em `proposalsData.setStatus()`.
  - `account(provider_id, account_id)` para buscas OAuth do Better Auth.
  - `UNIQUE(user_id)` em `user_settings`, e tipagem `.$type<SkinId>()` / `.$type<ProposalPayload>()`.
  - Avaliar migrar PK das tabelas `owned()` para composta `(user_id, id)` + validar `UUID_PATTERN` em `packages/sync/src/tables.ts` (elimina oracle de existência de IDs entre contas).
- **Housekeeping automático no cron (`apps/api/src/index.ts`):**
  - Limpar `session` expiradas, `verification` expiradas, `proposals` expiradas, `sync_mutations` antigas e definir política de compactação de tombstones (`deleted_at IS NOT NULL`).
- **Quotas e limites por conta:**
  - Limite máximo de registros por usuário nas tabelas de estudo e `proposals` para proteger o banco D1 compartilhado.
- **Segurança adicional na API:**
  - Trocar `?token=<bearer>` em `/api/sync/ws` (`apps/api/src/http/session.ts` + `apps/web/src/global/store/transport.ts`) por um ticket efêmero de uso único (TTL ~30s via `POST /api/sync/ws-ticket`).
  - Adicionar rate limit secundário por e-mail/IP em `/api/auth/sign-in/email` (ou Turnstile no login) para frear credential stuffing distribuído.
  - Proteger `captchaOk` em `apps/api/src/http/waitlistRoutes.ts` com `try/catch`, timeout, checagem de `response.ok` e `result.hostname`.
  - Trocar `SHA-256("${BETTER_AUTH_SECRET}:${ip}")` em `apps/api/src/legal/acceptances.ts` por HMAC-SHA256 com chave derivada/dedicada.
  - Ler `env.APP_URL` por requisição em `apps/api/src/index.ts` (em vez de no escopo de módulo do `OAuthProvider`).
  - Limitar conexões WebSocket simultâneas por usuário e adicionar `webSocketError` no `UserHub`.
- **Observabilidade e healthcheck:**
  - `/api/health` validar `SELECT 1` no D1.
  - Logs estruturados com `requestId`, rota e `userId`; integração com ferramenta de monitoramento/alertas para falhas no cron e 5xx.
  - `GET /api/export`: avaliar streaming/compactação para históricos grandes e incluir dados cadastrais + histórico legal para portabilidade completa da LGPD.

### 2.2 Domínio, Gamificação e Oráculo (`packages/domain`, `packages/agent-context`, `packages/sync`)
- **Bugs de ciclo e exclusões:**
  - `addCycleItem` e `moveCycleItem` (`packages/domain/src/cycle.ts`) devem limpar `lastCycleSessionId` (evita inconsistência em `cycleLaps` ao excluir a sessão que fechou a volta).
  - `removeCycleItem` (`packages/domain/src/cycle.ts`) deve normalizar `cyclePosition` quando o último bloco é removido.
  - `removeSubject` e `removeTopicTree` (`packages/domain/src/catalog.ts`) devem recalcular `cyclePosition` e limpar `lastCycleSessionId` órfão.
- **Bugs em sessões e revisões (`packages/domain/src/sessions.ts`):**
  - Adicionar `validateSessionChange` em `updateSession` (validar inteiros, `minutes` em `1..1440`, `correct <= questions`, `note <= 5000`, `isDateKey`).
  - Em `updateSession`, não deslocar `dueDate` de revisões já concluídas e reavaliar `adaptNextReviews`/`completedBySessionId` quando editar uma sessão de `"Revisão"`.
  - Em `recordSession`, primeira sessão do tipo `"Revisão"` não deveria impedir agendamento futuro de revisões quando o aluno estudar `"Teoria"`/`"Questões"`.
  - Em `adaptNextReviews`, evitar perda do histórico de deslocamento quando duas revisões consecutivas deslocam o mesmo estágio futuro.
- **Alinhamento de validações `domain` × `sync`:**
  - `validateSession`, `updateSubject`, `updateExam` e `recordMockExam` devem barrar os mesmos limites que `rowSchemas` (evitando rejeições tardias no push) e deduplicar `subjectId` em `recordMockExam`.
- **Contrato diário (`packages/domain/src/game/contracts.ts`):**
  - No fallback por cobertura de `weakestSubject`, considerar apenas sessões com `s.date < date` para o contrato 3 não trocar de matéria no meio do dia.
- **Pureza de datas:**
  - Passar `date` explícito em `weekSummary` (`tracking.ts`), `weekTargetFor` (`weekTargets.ts`) e `buildCycle` (`cycle.ts`, também validando `blockMinutes > 0`).
- **Oráculo (`packages/agent-context`):**
  - Chamar `validateSyllabusImport` e validar existência de `examId` em `previewProposal`/`applyProposal` para `kind: "syllabus"` (`proposals.ts`).
  - Em `importSyllabus` (`syllabus.ts`), aplicar `pointsPerQuestion ?? 1` quando `questions` for informado sem `pointsPerQuestion` (hoje cai para peso 1), e limpar `weight` ao atualizar matéria existente com `questions`.
  - Adicionar `.max()` em `SyllabusImportSchema` (`subjects`, `topics`, `subtopics`) e `.max(100_000)` em `positiveSchema` (`parse.ts`).
  - Escapar ```` ``` ```` dentro de `renderPrompt` (`tasks.ts`) e tornar `extractJson` (`parse.ts`) resiliente a múltiplos blocos de código ou crases em strings.
  - Padronizar `.toLocaleLowerCase("pt-BR")` em todas as comparações de nomes e deduplicar antes de contar tópicos em `previewOne`.
- **Otimizações de algoritmo:**
  - Pré-agregar minutos por `(examId, weekStart)` em `weeksWithGoal`, `weeklyStreak` e `celebrationsBetween` (evita chamar `weeklyAllocation` dezenas/centenas de vezes).
  - Trocar buscas lineares O(N²) por `Map` em `weeklyAllocation`, `topicsInOrder`, `topicPath`, `buildStudyContext` e `importSyllabus`.
  - Cachear `AppData` por tabela em `SyncClient` e só chamar `begin()/commit()` em coleções que realmente tiveram mudanças no `pullAll()` (reduz até 9× os re-renders por página).
  - Tratar `hydrateBaseline()` em `firstPull()` para não bloquear `ready` pela rede quando o banco local já está hidratado, e evitar corrida com `startOfflineExecutor`.
  - Redistribuição de mínimo de 30 min em `weeklyAllocation` retirar da matéria com maior carga horária em vez da primeira da lista.
  - Corrigir comparador não-reflexivo em `monthSummary` (`tracking.ts:90`).

### 2.3 Frontend Web, Cronômetro, PWA e Bundle (`apps/web`, `packages/ui`)
- **Offline real no cold start (PWA e Mobile):**
  - Registrar `apps/web/public/sw.js` na carga do app com precache do app shell (Vite PWA / Workbox ou estratégia stale-while-revalidate para assets estáticos, nunca cacheando `/api/*`), `skipWaiting`/`clients.claim`, e checagem de origem no `notificationclick`.
  - Persistir snapshot da sessão em `guards.ts` para permitir abrir `/_app` offline com os dados do SQLite local (revalidando quando a rede voltar).
- **Bugs de estado e formulários:**
  - **Trocar concurso com cronômetro ativo (`useStudy.ts`):** amarrar o `examId` ao estado do timer ou impedir/encerrar o timer ao trocar de concurso (hoje grava sessão ligando `examId` novo a matéria/assunto/bloco antigos).
  - **Cronômetro multi-aba e UX (`timerStore.ts`, `TimerTicker.tsx`, `TimerSheet.tsx`):** escutar evento `window.addEventListener("storage")`, atualizar ao voltar com `visibilitychange`, corrigir drift de `Math.floor(Date.now() / 1000)` no `useNow`, atualizar `subjectName` no `changeSubject`, evitar notificação duplicada com Web Push, e pedir confirmação antes de "Descartar o cronômetro".
  - **Stale closure + duplo submit (`useStudy.ts`, `useMockExams.ts`, `useOracle.ts`):** rodar `recordSession`/`recordMockExam` dentro do callback `store.update((current) => ...)` e travar botão com estado `submitting`. Em `useOracle.settle`, confirmar status no servidor (ou tornar idempotente) antes de aplicar localmente, e corrigir `apiUrl("/mcp")` em vez de `window.location.origin`.
  - **Sessão expirada e reconexão WS (`transport.ts`, `StoreProvider.tsx`):** disparar `sync()` ao reconectar o WebSocket (`socket.onopen` quando `attempts > 0`), interromper loop de reconexão WS se a sessão expirou, e adicionar alerta `beforeunload` com timer rodando ou `pending > 0`.
  - **Resiliência de rotas (`__root.tsx`, `conta/index.tsx`, `routes/entrar.tsx`):** adicionar `errorComponent` (`ErrorBoundary`) e `notFoundComponent` (404 em PT-BR); tratar erro de `/api/config` em `SignUpPage` (evitar tela branca) e `ForgotPasswordView`; em `routes/entrar.tsx`, só redirecionar no `catch` se `isRedirect(err)`.
  - **Formulários:** `useSubmit.run` capturar exceções em `catch` e ignorar duplo clique; resetar widget Turnstile após erro e não cachear falha de carregamento do script (`Turnstile.tsx`); permitir apagar o campo minutos em `JourneySheets.tsx`; validar negativos/data vazia em `SessionForm.tsx` e `useMockExams.ts`; validar `1..365` em `ReviewsView.tsx`; corrigir numeração de assuntos com subassuntos e feedback de peso/cancelar com `Esc` em `SubjectPanel.tsx`; atualizar data após meia-noite em `useStudy`/`useMockExams`; limpar `timerStore` ao excluir concurso/matéria/assunto em `useSyllabus.ts`; limpar aceite salvo se `signUpWithGoogle` falhar; trocar `<a href>` internos por `<Link to>` (`CookieBanner`, `PrivacySheet`, `legal/index.tsx`).
- **Performance de bundle e re-renders:**
  - Carregar `nativePlatform`/`webPlatform` (`platform/index.ts`) e `setupNativeShell` (`main.tsx`) com `import()` dinâmico ou alias de build separado web vs mobile.
  - Quebrar barrel de `features/conta/index.tsx` para não puxar código autenticado em `/entrar` e `/criar-conta`.
  - Reduzir assinaturas de `useStore()` inteiro no `AppShell` (`usePlayer.ts` usar `useLiveQuery`/seletores e aproveitar `Route.useRouteContext()` em vez de chamar `useSession()` em paralelo; `useOnboarding.ts` usar `useStoreActions()`; `useAccount.ts` usar só `useSyncState()`).
  - Importar apenas subsets `latin`/`latin-ext` do Fontsource em `packages/ui/src/theme.css` e adicionar `decoding="async"` em `<Art>`.
- **Conformidade com `AGENTS.md`:**
  - Remover checagem de `platform.native` em `features/conta/hooks/useNotifications.ts` e `global/components/ReviewReminders.tsx`.
  - Trocar fetches em `useEffect` por `useQuery` em `useCookieBanner.ts` e `useLegalGate.ts`.
  - Usar `apiFetch` em `features/conectar/hooks/useConsent.ts`.
  - Migrar `rgb(...)` e medidas/raios arbitrários (`rounded-[5px]`, `text-[13.5px]`, etc.) para tokens em `packages/ui/src/theme.css`.

### 2.4 CI/CD (`.github/workflows/`)
- **Corrigir PR Previews (`deploy-preview.yml`):** incluir padrão de origem dos preview aliases (`pr-<N>-meu-edital-preview...`) em `trustedOrigins` no ambiente `preview`, adicionar guarda `if: github.event.pull_request.head.repo.full_name == github.repository` para não falhar em forks, e avaliar estratégia segura para migrações D1 em PRs (banco compartilhado).
- **Hardening de pipelines (`ci.yml`, `deploy-production.yml`):** declarar `permissions:` mínimos, filtrar `event == 'push'` em `deploy-production.yml`, adicionar backup/export antes de migração em produção + smoke test `/api/health` pós-deploy, e incluir build de `apps/site` no CI.

---

## 3. Prioridade Média (P2) — Produto, Mobile, Site, Acessibilidade e Testes

### 3.1 Produto e UX
- **Feedback global de sync e erros:** exibir indicador discreto no `AppShell` quando estiver offline, com fila pendente, erro de sync ou `store.rejected` (com ação de tentar de novo / ver motivo / descartar), e adicionar toasts leves para confirmações de salvamento (`onBlur`, copiar no `OracleView` mobile).
- **Gerenciamento de conta (`/conta`):** editar nome, trocar e-mail, trocar senha estando logado e **importar backup JSON** (complementando `exportJson`, que hoje também omite `activeExamId` e `seenCelebrations`).
- **Edital (`/edital`):** busca e filtro de assuntos (estudados / pendentes), importação em lote (colar lista de tópicos) e botão de reordenar matérias disponível também no mobile (com opção de subir e descer).
- **Histórico (`/semana`):** busca nas anotações, filtro por matéria/tipo e visão de histórico contínuo (além de semana a semana).
- **Simulados (`/simulados`):** edição de simulado já registrado, opção de fator de correção (ex.: Cebraspe: errada anula certa / em branco) e nota ponderada/discursiva.
- **Cronômetro (`/estudar`):** modo Pomodoro/pausas, som opcional de fim de bloco e atalhos de teclado (ex.: `Espaço` iniciar/pausar).
- **Consistência visual:** empty states com botão para `/comecar` em `WeekView`, `MockExamsView`, `PerformanceView` e `ReviewsView`; tornar card "Chefe" em `JourneySheet` clicável para `/simulados`; avaliar ocultar ou marcar claramente "Guilda" na barra principal enquanto estiver em construção.

### 3.2 App Mobile (`apps/mobile` e `apps/web/src/platform/`)
- **Assets e release Android:** substituir ícones e splash padrão do Capacitor pelos do Meu Edital (alinhando `ic_launcher_background` com `#c2a09a`), configurar `signingConfigs` + `minifyEnabled true` (R8) + versionamento em `build.gradle`.
- **Manifest e Foreground Service (`targetSdk 36`):** definir `android:allowBackup="false"` (evita corrupção do Keystore), avaliar `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`, preparar justificativa de `foregroundServiceType="specialUse"` para Play Store, proteger `startForegroundService` com `try/catch` (`StudyTimerPlugin.java`), limpar referência estática `instance` em `handleOnDestroy()`, atualizar notificação diretamente no `StudyTimerService` ao tocar "Pausar", e solicitar `POST_NOTIFICATIONS` ao iniciar o timer no Android 13+.
- **Fluxos quebrados no nativo:**
  - Exportação LGPD (`PrivacySheet.tsx`, `LegalGate.tsx`) usar `apiFetch` + download/Share nativo (links `<a href>` não enviam header `Bearer`).
  - `useConsent.ts` usar `apiFetch`, e `routes/entrar.tsx` / `useSignIn.ts` tratar retorno de `/authorize` com `apiUrl`.
  - `native.ts`: `push.unsubscribe()` cancelar `REVIEW_IDS` e `BLOCK_END_ID`; `blockEnd.schedule()` respeitar a preferência `avisos`; `ReviewReminders.tsx` reagir à troca do toggle de avisos.
  - `http.ts`: envolver `platform.secureStorage.get()` em `try/catch` e validar `VITE_API_ORIGIN` no build nativo.
  - Configurar App Links (`assetlinks.json`, corrigindo divergência `meuedital://` vs `app.meuedital`), OAuth Google fora da WebView (Chrome Custom Tabs / plugin nativo) e garantir compatibilidade do Turnstile na WebView (`https://localhost` / `capacitor://localhost`).
- **iOS:** criar projeto `apps/mobile/ios/` (`Info.plist`, `PrivacyInfo.xcprivacy`, ícones, splash, plugin Swift `StudyTimer` / Live Activity) e guardar chamadas ao `StudyTimer` em `native.ts` por plataforma (`Capacitor.getPlatform() === "android"`).

### 3.3 Site de divulgação (`apps/site`)
- **SEO:** configurar `site` em `astro.config.mjs`, gerar `sitemap.xml` e `robots.txt`, adicionar `<link rel="canonical">`, `og:type`, `og:url`, `og:image`, `og:site_name`, `twitter:card` e JSON-LD (`SoftwareApplication` / `FAQPage`).
- **Legal:** criar `termos.astro` (com link no rodapé) e gerar `privacidade.astro` a partir de `docs/legal/privacidade.md` para evitar divergência.
- **Waitlist, acessibilidade e DX:** mostrar erro se `/api/config` falhar em `Waitlist.astro`, melhorar validação de e-mail, aumentar `summary` para `min-height: 44px`, adicionar skip-link e `<nav>`, evitar cópia manual de `tokens.css`, e adicionar scripts `lint` e `test` em `apps/site/package.json`.

### 3.4 Acessibilidade (`apps/web`, `packages/ui`)
- Garantir área mínima de toque de 44px em `Chip` (`min-h-10` → `min-h-11`), `NavItem` (`min-h-9`), `WeakTag` e botões de expansão em `PerformanceView`, inputs de `MockExamsView`/`SubjectPanel` e links de ação no mobile.
- Adicionar `<h1>` semântico em cada tela interna, skip-link em `AppShell.tsx`, `aria-expanded`/`aria-haspopup` em botões de menu/seletor, e ajustar `:focus-visible` (`packages/ui/src/theme.css`) para manter contraste alto sobre fundos `bg-teal-strong` (ex.: `outline-offset` + cor contrastante ou duplo anel).

### 3.5 Cobertura de testes
- **`apps/web`:** configurar Vitest + Testing Library para testar hooks críticos (`useStudy`, `useWeek`, `useOracle`, `useNotifications`, `useLegalGate`, `useCookieBanner`) e adaptadores `platform/*`.
- **E2E (`e2e/`):** expandir além de `fluxo-principal.spec.ts` para cobrir login/logout/waitlist/exclusão de conta, edição e exclusão de sessão, cronômetro com reload, revisões, simulados, CRUD no edital, modo offline (`setOffline(true)`), Oráculo (OAuth + propostas) e fluxos LGPD (`LegalGate`, `CookieBanner`, exportação).
- **`packages/domain`, `packages/sync`, `packages/agent-context`:** cobrir `updateSession`, `deleteSession`, `adaptNextReviews` encadeado, `removeExam`/`removeSubject`/`removeTopicTree`, `mockExams`, `weekTargets`, `performanceBySubject`, `inFinalStretch`, propostas `syllabus`, `extractJson`, e transações multi-lote (> 200) com falha parcial.
- **Qualidade estática:** avaliar ativar `noUncheckedIndexedAccess: true` no `tsconfig.base.json` e `eslint-plugin-jsx-a11y` no `apps/web`.
