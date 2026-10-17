# Meu Edital

Aplicativo de **estudo cíclico para concursos públicos**, no celular (Android/iOS) e no navegador. Ele transforma o edital em matérias e assuntos, monta um ciclo de estudos pelos pesos de cada matéria e acompanha o que foi estudado na semana.

O app responde a duas perguntas:

- **O que eu estudo agora?** → o próximo bloco do ciclo, com um assunto sugerido.
- **Como foi minha semana?** → tempo estudado contra a meta, por matéria e por dia.

> Agentes de código: este arquivo explica **o que** o app é. Para **como** trabalhar no código, leia [AGENTS.md](AGENTS.md).

## Como o estudo funciona

| Conceito | O que é |
| --- | --- |
| **Concurso** | O objetivo do estudante: nome, cargo, banca, data da prova e meta de horas por semana. É possível ter vários; um fica ativo. |
| **Matéria** | Disciplina do edital. Tem um peso: `questões × pontos por questão`, um peso informado ou peso 1. |
| **Assunto** | Item do conteúdo programático de uma matéria. Pode ter subassuntos. Fica marcado como estudado na primeira sessão. |
| **Ciclo** | Fila de **blocos** (matéria + minutos). Uma **volta** completa soma a meta semanal. O tempo de cada matéria vem do peso, do aproveitamento nas questões, dos assuntos ainda não estudados e das revisões vencidas. |
| **Sessão** | Registro de um estudo: matéria, assunto, tipo (Teoria, Questões ou Revisão), minutos, questões e acertos. Uma sessão feita a partir de um bloco avança o ciclo. |
| **Revisão** | Agendada automaticamente quando um assunto é estudado pela primeira vez (1, 7 e 30 dias por padrão). Uma sessão do tipo Revisão conclui as revisões vencidas daquele assunto. |
| **Semana** | De segunda a domingo. Compara o estudado com a meta e mostra as matérias que ficaram para trás. |

O ciclo **não depende do calendário**: faltou um dia, o estudante continua de onde parou. Não existe plano dia a dia.

## Telas

- **Início:** próximo bloco do ciclo, revisões vencidas e resumo da semana.
- **Ciclo:** sequência de blocos. Dá para gerar o ciclo pelos pesos, reordenar, ajustar a duração, pular e excluir blocos.
- **Estudar:** cronômetro (persistente, com notificação no Android) e registro da sessão.
- **Semana:** meta × estudado, dia a dia, por matéria, matérias atrasadas e lista de sessões. Navega por semanas anteriores.
- **Revisões:** revisões pendentes e intervalos configuráveis.
- **Editais:** concursos, matérias, pesos, assuntos e subassuntos.
- **IA externa:** importar o edital e revisar a semana com qualquer IA.

## IA externa: a IA sugere, o estudante decide

O app não chama nenhuma API de IA. Ele gera um pedido em texto com:

1. instruções da tarefa;
2. o contexto de estudo em JSON (`StudyContext`, versionado, com nomes legíveis em vez de ids);
3. o JSON Schema exato da resposta.

O estudante cola o pedido no ChatGPT, Claude, Gemini, NotebookLM ou outra IA e traz a resposta de volta. O app valida o formato, confere os nomes das matérias e mostra cada alteração como **antes → depois**. Nada é salvo sem confirmação. A resposta é tratada como dado não confiável.

Tarefas disponíveis:

- **Importar edital:** extrai matérias, assuntos, subassuntos e pesos do edital.
- **Revisar a semana:** gera uma análise, recomendações e propostas de ajuste (peso de matéria, meta semanal, novo ciclo).

O mesmo pacote (`@meu-edital/agent-context`) já gera mensagens + schema para uma futura integração por API ou servidor MCP.

## Dados e conta

- **Com Supabase configurado:** login com Google ou por código enviado ao e-mail. O banco é a fonte da verdade, com RLS (cada usuário só vê os próprios dados). Cada aparelho guarda uma cópia e uma fila de alterações, então dá para estudar offline. Ao voltar para o app ou para a aba, ele busca o que mudou em outro aparelho.
- **Sem Supabase (modo local):** sem conta, dados só no aparelho, com um concurso de demonstração (DETRAN-SP).

## Tecnologia e estrutura

Expo SDK 57, React Native, Expo Router, TypeScript, Zod e Supabase, num monorepo com npm workspaces e Turborepo.

```text
apps/app                 App Expo (Android, iOS e web)
packages/domain          Modelos e regras de estudo (TypeScript puro)
packages/agent-context   Contrato de contexto, tarefas e propostas para IA externa
supabase/migrations      Esquema do banco com RLS
```

## Executar

Requer Node.js 22.13+ e npm. Rode os comandos na raiz.

```bash
npm install
npm run web     # app no navegador
npm run dev     # Metro para o development build no Android/iOS
npm run check   # lint, typecheck e testes de todo o monorepo
```

Sem configurar nada, o app abre no modo local.

### Configurar o Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. Aplique as migrações de `supabase/migrations` (no SQL Editor ou com `npx supabase link` + `npx supabase db push`).
3. Em **Authentication → Email Templates → Magic Link**, inclua `{{ .Token }}` no e-mail. O login usa esse código.
4. Login com Google (opcional):
   - No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um ID de cliente OAuth do tipo **Aplicativo da Web**. Em **URIs de redirecionamento autorizados**, use `https://<seu-projeto>.supabase.co/auth/v1/callback`.
   - No Supabase, em **Authentication → Sign In / Providers → Google**, ative o provedor e cole o Client ID e o Client Secret.
   - Em **Authentication → URL Configuration → Redirect URLs**, adicione `http://localhost:8081` (web local), o endereço publicado da web e `meuedital://**` (Android e iOS).
   - No celular, o login com Google precisa de development build ou build de produção. No Expo Go, o endereço de volta não é estável.
5. Copie `apps/app/.env.example` para `apps/app/.env.local` e preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY` (chave publicável, em Project Settings → API).

### Publicar a web (EAS Hosting)

A web é uma SPA publicada no [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/). O plano gratuito dá um endereço `*.expo.app`.

```bash
npx eas-cli@latest login    # uma vez
npm run deploy:web          # exporta e publica em produção
npm run deploy:web:preview  # publica uma prévia com URL própria
```

As variáveis `EXPO_PUBLIC_*` entram no build, então `apps/app/.env.local` precisa existir na máquina que publica. Depois do primeiro deploy, configure o endereço em **Supabase → Authentication → URL Configuration → Site URL**.

### Android

Development build no emulador (com o Android SDK instalado):

```bash
npm run android:build --workspace=@meu-edital/app
```

Depois, `npm run android`. Repita o build quando mudar dependências nativas. Builds na nuvem: `npx eas-cli@latest build` dentro de `apps/app`.

## Fora do escopo

Pagamentos, recursos sociais, gamificação complexa, notificações push e APIs pagas de IA.

## Licença

Distribuído sob a [GNU GPL versão 3](LICENSE) (`GPL-3.0-only`). Quem distribuir uma versão que incorpore ou modifique este código deve disponibilizar o código-fonte sob a mesma licença. O aviso dos arquivos vindos do template da Expo está em [LICENSES/Expo-template-MIT.txt](LICENSES/Expo-template-MIT.txt). As dependências mantêm suas próprias licenças.
