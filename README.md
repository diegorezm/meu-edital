# Meu Edital

O **Meu Edital** é um aplicativo de estudo cíclico para concursos públicos, no celular e no navegador. Ele transforma o edital em matérias e assuntos, organiza um **ciclo de estudos** pelos pesos de cada matéria e acompanha o que você estudou na semana, respondendo com clareza: **“O que preciso estudar agora?”** e **“Como foi minha semana?”**

## Filosofia do produto

- **Estudo cíclico, não calendário.** O ciclo é uma fila de blocos (matéria + tempo). Você estuda o próximo bloco, o ciclo avança e, ao terminar, começa uma nova volta. Faltou um dia? Continue de onde parou. Uma volta equivale à meta semanal, dividida pelo peso das matérias, pelo desempenho nas questões e pelas revisões pendentes.
- **Acompanhamento semanal para planejar melhor.** A tela Semana compara o tempo estudado com a meta, por matéria e por dia, e destaca o que ficou para trás.
- **A IA externa interpreta e sugere; o app organiza, registra e acompanha.** O app gera um pedido com o contexto de estudo e o formato exato da resposta. A resposta é validada, mostrada como prévia e só é aplicada com a sua confirmação. O conteúdo vindo da IA é tratado como dado não confiável, nunca como código.
- **Simples e rápido:** próximo bloco em destaque, interface limpa, boa leitura no celular e no navegador, pouca animação.

## Estrutura

Monorepo com npm workspaces e Turborepo:

| Pasta | Conteúdo |
| --- | --- |
| `apps/app` | App Expo (Android, iOS e web) com Expo Router. `src/app` tem só as rotas; cada pasta de `src/features` expõe sua tela em `index.ts`; `src/global` reúne UI, store, sincronização e utilidades compartilhadas. |
| `packages/domain` | `@meu-edital/domain`: modelos e regras de estudo (ciclo, distribuição por peso, sessões, revisões, resumo semanal). TypeScript puro, sem React. |
| `packages/agent-context` | `@meu-edital/agent-context`: contrato de contexto para agentes externos, tarefas, propostas de alteração e validação das respostas. |
| `supabase/migrations` | Esquema do banco com RLS. |

### Contexto para agentes externos

`@meu-edital/agent-context` define o pacote que vai para qualquer IA:

- **`StudyContext`** (schema Zod, versão 1): retrato do estudo com nomes legíveis em vez de ids e métricas prontas (meta e tempo por matéria, cobertura do edital, aproveitamento, ciclo, últimas semanas, revisões vencidas, sessões recentes). Mudanças incompatíveis exigem nova versão.
- **Tarefas** (`AgentTask`): instruções, recorte do contexto e schema da resposta. Hoje: `importar-edital` e `revisar-semana`.
- **Propostas** (`ChangeSchema`): alterações que a IA pode sugerir (`setSubjectWeight`, `setHoursPerWeek`, `setCycle`). O app mostra antes/depois de cada uma e aplica só as que você marcar.
- **Transporte:** `renderPrompt` gera o texto para copiar e colar; `taskRequest` gera mensagens + JSON Schema para uma futura integração por API (saída estruturada) ou servidor MCP, sem mudar o domínio.

### Dados e sincronização

Com o Supabase configurado, o app pede login por código enviado ao e-mail e o banco é a fonte da verdade. Cada aparelho guarda uma cópia para abrir rápido e uma fila de alterações, enviada quando há conexão, então dá para registrar estudo offline. Ao voltar para o app ou para a aba do navegador, ele busca o que mudou em outro aparelho.

Sem as variáveis do Supabase, o app roda no **modo local**: sem conta, dados só no aparelho, com o concurso DETRAN-SP de demonstração.

## Executar e verificar

Requer Node.js 22.13+ e npm. Todos os comandos rodam na raiz.

```bash
npm install
npm run web        # app no navegador
npm run dev        # Metro para Android/iOS (development build)
npm run check      # lint, typecheck e testes de todos os pacotes (Turborepo)
npm run build:web  # exporta a versão web para apps/app/dist
```

### Configurar o Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. Aplique `supabase/migrations/20261016000000_initial_schema.sql` (cole no SQL Editor ou use `npx supabase link` + `npx supabase db push`).
3. Em **Authentication → Email Templates → Magic Link**, inclua o código `{{ .Token }}` no texto do e-mail: o app faz login digitando esse código.
4. Copie `apps/app/.env.example` para `apps/app/.env.local` e preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY` (chave publicável, em Project Settings → API).

### Android sem fila do EAS

Para criar e instalar o development build no emulador, com o Android SDK configurado:

```bash
npm run android:build --workspace=@meu-edital/app
```

Depois da primeira instalação, use `npm run android`. Repita o build quando mudar dependências ou a configuração nativa. Builds na nuvem: `npx eas-cli@latest build` dentro de `apps/app`.

O escopo não inclui pagamentos, recursos sociais, gamificação complexa, notificações push ou APIs pagas de IA.

## Licença

O código do Meu Edital é distribuído sob a [GNU GPL versão 3](LICENSE) (`GPL-3.0-only`). Quem distribuir uma versão que incorpore ou modifique esse código deve disponibilizar o código-fonte correspondente sob a mesma licença. O aviso de licença dos arquivos provenientes do template da Expo está preservado em [LICENSES/Expo-template-MIT.txt](LICENSES/Expo-template-MIT.txt). As dependências mantêm suas próprias licenças.
