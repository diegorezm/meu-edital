# 0015. LGPD: aceite versionado dos termos e consentimento de rastreamento

## Contexto

O app trata dados pessoais (conta, histórico de estudo) e vai ganhar ferramentas de terceiros (Sentry, PostHog, Google Analytics) e pagamentos. A LGPD exige base legal para cada tratamento, transparência e prova do consentimento (art. 8º, § 2º), e as políticas mudam com o tempo.

## Decisão

**Documentos versionados.** Termos de Uso e Política de Privacidade têm versões datadas (`AAAA-MM-DD`). A lista fica em `apps/api/src/legal/documents.ts` e os textos em `docs/legal/`, de modo que o histórico fica no git. Cada versão diz se a mudança é *material*.

**Aceite registrado.** A tabela `legal_acceptances` só recebe inserções: usuário, documento, versão, data, hash do IP (SHA-256 com o segredo do app, sem o IP em claro) e user-agent. O app registra o aceite por `POST /api/legal/aceite`, sempre com a versão vigente.

**Bloqueio até aceitar.** O middleware `requireConsent` (depois de `requireUser`) responde `409 consent_required` nas rotas de dados (sync, propostas, push e conexões do Oráculo) enquanto houver mudança material sem aceite. `/api/me` devolve `legalPending` para o app mostrar o modal. Exportar os dados e excluir a conta continuam liberados, porque são direitos do titular (art. 18). Mudança não material só gera aviso.

Quem já tinha conta antes desta decisão aceita no próximo acesso. O cadastro com Google passa pelo mesmo fluxo, porque o aceite é sempre uma chamada à parte, depois de existir sessão.

**Rastreamento por categoria.** A escolha fica no aparelho (`src/platform/tracking/`) e, com sessão, na tabela `tracking_consents` (só inserções, com a versão da política), por `GET/POST /api/legal/rastreamento`. O banner volta quando a política muda. Para ligar uma ferramenta, acrescente um `TrackingProvider` em `PROVIDERS`.
- *Erros* (Sentry): base legal de legítimo interesse (art. 7º, IX), sem PII (`sendDefaultPii: false`, sem replay, sem IP). Fica ligado, com aviso na política e opção de desligar (oposição, art. 18 § 2º).
- *Análise* (PostHog, GA): só com opt-in. Os SDKs só carregam depois do consentimento, atrás de `src/platform/tracking/`.
- Banner com "Aceitar", "Recusar" e "Personalizar" com o mesmo peso visual.

**Pagamentos.** O processador (Stripe ou Mercado Pago) recebe os dados do cartão direto. Entra como operador na política, numa nova versão material.

## Alternativas descartadas

- Versões numa tabela do banco: dá mais trabalho publicar e o texto sairia do git.
- Aceite pelo Better Auth (campo no cadastro): não cobre o login com Google nem o re-aceite.
- Bloquear também a exportação: impediria o titular de exercer os próprios direitos.
