# Reconstrução do Meu Edital na Cloudflare

## Contexto

O Meu Edital é um app de estudo cíclico para concursos públicos brasileiros. Ele transforma o edital em matérias e assuntos, monta um ciclo de estudos pelos pesos de cada matéria e acompanha o que foi estudado na semana. Responde a duas perguntas: "o que eu estudo agora?" e "como foi minha semana?".

A versão atual (Expo/React Native + Supabase) está em `C:\Users\diego\projetos\meu-edital` e serve como referência de produto e de regras. Ela é um protótipo sem usuários reais: não há dados nem contas para migrar. Vamos reconstruir do zero, na mesma pasta e em um repositório novo (seção "Preparação"), por quatro motivos:

1. Sair de Expo e Supabase e rodar tudo na Cloudflare.
2. Trocar a UI por uma com cara de RPG (seção "UI").
3. Tornar o estudo viciante com gamificação (seção "Gamificação").
4. Corrigir lacunas de produto e de arquitetura listadas abaixo.

Não é uma migração arquivo a arquivo. Reaproveite as regras de negócio; redesenhe o resto.

## Preparação (faça antes de tudo)

O projeto novo nasce na mesma pasta, `C:\Users\diego\projetos\meu-edital`. O antigo fica guardado em `_old/` só como referência durante a reconstrução.

1. **Repositório antigo no GitHub:** já foi apagado. Não há remoto até a reconstrução terminar.
2. **Recomece o git local:** apague a pasta `.git` e rode `git init`. Trabalhe só localmente; não crie repositório no GitHub agora.
3. **Mova o projeto antigo para `_old/`:** todos os arquivos e pastas da raiz vão para `_old/`, **exceto** `docs/prompt-reconstrucao.md`, `docs/design-system/` e `docs/mockups/`, que ficam onde estão. Não mova `.git` (já recriado) nem `node_modules` (apague, se existir).
4. **Ignore `_old/` no git:** coloque `_old/` no `.gitignore` novo. Ela nunca entra em um commit.

**Últimos passos, ao terminar a reconstrução** (todas as fases prontas, inclusive a de mobile, que porta o cronômetro de `_old/`), nesta ordem, confirmando comigo antes de cada um:

1. **Apague `_old/`.** Nenhum arquivo do projeto novo pode importar ou referenciar `_old/`.
2. **Crie o repositório novo no GitHub, privado:** `gh repo create diegorezm/meu-edital --private --source . --remote origin`, e envie o código com `git push -u origin main`. Só então ative o CI no GitHub Actions (seção "Arquitetura"); até aqui, o deploy é manual.

## O que reaproveitar

Do projeto antigo, em `_old/`, copie para o repositório novo:

- `packages/domain` e `packages/agent-context`: TypeScript puro, com testes, sem React nem Expo. Porte os dois com os testes e evolua a partir deles.
- `docs/design-system/` e `docs/mockups/dashboard-rpg.html`: o design system e a dashboard de referência (seção "UI"). Esses não vão para `_old/`; já estão no lugar certo.

Leia também `_old/README.md` e `_old/AGENTS.md` antes de começar. Todo o resto (telas, store, sync, auth, módulo nativo) é reescrito. Os outros arquivos de `docs/mockups/` são tentativas de visual descartadas; ignore-os.

## Regras do domínio (continuam valendo)

- **O estudo é cíclico.** O ciclo é uma fila de blocos (matéria + minutos) e é a única fonte de "o que estudar agora". Não existe plano dia a dia: faltou um dia, o estudante continua de onde parou.
- Uma volta do ciclo soma a meta semanal de horas.
- O tempo de cada matéria vem do peso (`questões × pontos por questão`, peso informado ou 1), ajustado por aproveitamento nas questões, assuntos ainda não estudados e revisões vencidas. Mudanças nessa regra só com testes.
- O assunto é escolhido por sessão: primeiro o não estudado na ordem do edital, depois o estudado há mais tempo.
- Registrar uma sessão é a única forma de salvar estudo. Ela marca o assunto como estudado, agenda revisões, conclui revisões vencidas quando é do tipo Revisão e avança o ciclo quando veio de um bloco.
- Datas são strings locais `AAAA-MM-DD`. Nunca use `toISOString()` para datas: desloca o dia no fuso do Brasil.
- Funções de domínio são puras: `(data, ...) => data`, sem mutação e sem I/O.
- A semana vai de segunda a domingo.

No código, os nomes continuam os do domínio (`cycle`, `session`, `review`). Os nomes de RPG da seção "UI" (Jornada, Contratos, Guilda) existem só nos textos da interface.

## Funcionalidades

### Já existem e devem ser mantidas

- **Conta:** login com Google ou e-mail e senha. Uso offline com sincronização entre aparelhos.
- **Onboarding:** primeiro concurso em poucos passos, com nomes populares, data da prova e matérias iniciais com assuntos prontos.
- **Editais:** vários concursos, um ativo. Nome, cargo, banca, data da prova, horas por semana. Matérias com peso, assuntos e subassuntos, percentual do edital coberto, exclusão em cascata.
- **Ciclo:** geração automática pelos pesos com blocos intercalados; adicionar, reordenar, ajustar duração, pular e excluir blocos; posição e voltas.
- **Estudar:** cronômetro que sobrevive a fechar o app; estudo a partir de um bloco ou livre; assunto sugerido; registro de tipo (Teoria, Questões, Revisão), minutos, questões, acertos e anotação.
- **Revisões:** agendadas no primeiro estudo de cada assunto (1, 7 e 30 dias, configurável); vencidas e próximas.
- **Início:** próximo bloco, progresso do ciclo, semana por matéria, diário do mês, revisões vencidas, cobertura do edital, assuntos fracos.
- **Semana:** meta × estudado, por dia e por matéria, matérias atrasadas, lista de sessões, navegação por semanas anteriores.
- **IA externa:** o app não chama API de IA paga. Ele gera um pedido em texto (instruções + contexto em JSON + JSON Schema da resposta), o estudante cola em qualquer IA e traz a resposta. O app valida com Zod, mostra cada alteração como antes → depois e só aplica após confirmação. Tarefas: importar edital e revisar a semana.
- **Site de divulgação:** estático, separado do app.

### Correções que entram na primeira versão

1. **Editar e excluir sessão.** Hoje é impossível corrigir um registro errado. Excluir precisa desfazer os efeitos: assunto estudado, revisões agendadas, posição do ciclo.
2. **Registrar estudo em outra data.** O domínio aceita data; a tela precisa oferecer.
3. **Recuperação de senha, verificação de e-mail e exclusão de conta.** Exclusão é exigência da LGPD e das lojas, e apaga todos os dados do usuário.
4. **Meta histórica estável.** Hoje o resumo de uma semana passada usa a alocação e a meta de hoje. Salve um retrato da meta por matéria quando a semana começa.
5. **Revisão vira estudo.** "Revisar" abre a sessão já com assunto e tipo Revisão, em vez de só marcar como concluída.
6. **Aproveitamento com janela.** A alocação usa o histórico inteiro de questões; use as últimas 6 semanas para que um começo ruim não penalize a matéria para sempre.
7. **Ordem explícita.** A ordem dos assuntos hoje depende da ordem alfabética dos ids. Use um campo `position` e ids UUIDv7.

### Novas, em ordem de prioridade

1. **Gamificação** (seção própria abaixo). Faz parte do núcleo, não é enfeite.
2. **Servidor MCP remoto** como a forma principal de usar IA (seção "IA por MCP"). Copiar e colar continua existindo como alternativa para quem usa uma IA sem suporte a MCP.
3. **Desempenho:** tela por matéria e assunto com tempo, sessões, questões, aproveitamento e último estudo.
4. **Simulados:** registro de prova com questões e acertos por matéria, e evolução ao longo do tempo. No jogo, é o chefe do fim da volta.
5. **Exportar dados** em JSON e CSV.
6. **Catálogo de editais prontos:** concursos populares com matérias, pesos e assuntos, para começar sem importar nada.
7. **Revisão adaptativa:** o próximo intervalo considera o aproveitamento nas questões do assunto.
8. **Reta final:** perto da data da prova, a alocação dá mais peso a revisão e questões.
9. **Aviso de fim de bloco** quando o tempo planejado termina.
10. **Guildas:** grupos de amigos com liga semanal (fase posterior; ver "Gamificação").

Fora do escopo: pagamentos e chamadas a APIs pagas de IA a partir do app.

## Gamificação

O objetivo é fazer o estudante querer voltar todo dia. A regra que guia tudo: **só estudo de verdade dá recompensa.** Abrir o app, clicar em botões ou marcar coisas sem estudar não rende nada. Assim o vício é em estudar, não no app.

### Mecânicas

| No jogo | No domínio | Regra |
| --- | --- | --- |
| **XP e nível** do jogador | Sessões | 1 XP por minuto estudado; +2 por questão certa; +20 por revisão feita até o dia do vencimento; +200 por volta completa; +300 por semana com a meta batida. |
| **Patente** | Nível | Nomes de carreira pública a cada faixa de níveis (Estagiário, Técnico, Analista, Auditor...). |
| **Jornada** | Ciclo | Os blocos viram cartas numeradas: concluídas, a atual e as próximas. Faltou um dia, a jornada espera no mesmo lugar. |
| **Chefe da volta** | Simulado | Ao fechar uma volta, o jogo propõe um simulado. É opcional; pular não trava a jornada. |
| **Nível da matéria** | Cobertura + aproveitamento | Cada matéria é um atributo de uma a cinco estrelas, que sobe com assuntos estudados e acertos. |
| **Contratos do dia** | Derivados do estado | Três por dia, gerados do que o estudante mais precisa: próximo bloco, revisões vencidas, questões na matéria mais fraca. São cumpridos pelo estudo, não por clique. |
| **Ofensiva** | Semanas na meta | A sequência principal conta semanas com a meta batida, não dias. Há também uma contagem de dias de estudo, só informativa. |
| **Conquistas** | Marcos | Primeira volta, 100 questões, edital 50% coberto, simulado com 80%, etc. |
| **Gabinete** | Cosmético | Retrato e sala que ganham itens conforme o nível. Só aparência; nada compra vantagem. |

A ofensiva é semanal de propósito. O estudo é cíclico e a regra do produto é que faltar um dia não pune; uma sequência diária contradiria isso e incentivaria sessões de dois minutos só para não quebrar a sequência.

### Decisões de arquitetura

- **XP, nível, conquistas e contratos são derivados, não armazenados.** São funções puras em `packages/domain` calculadas a partir de sessões, revisões e simulados. Editar ou excluir uma sessão corrige o XP sozinho, não há como dessincronizar, e mudar a fórmula recalcula tudo. Armazene só o que não dá para derivar: itens cosméticos escolhidos e quais comemorações o usuário já viu.
- **Tabela de XP em um único arquivo de constantes**, com testes para cada regra.
- **Limites de sanidade no domínio:** no máximo 16 horas por dia e sessões de até 6 horas contam para XP. Isso evita erro de digitação.
- **Comemoração é evento de UI:** subir de nível, fechar volta e desbloquear conquista disparam uma animação curta. O domínio devolve a lista de eventos comparando o estado antes e depois de registrar a sessão.

### Guildas (fase posterior)

Deixe o caminho preparado, sem construir agora:

- **Guilda:** grupo fechado por convite. Não existe ranking global nem entre desconhecidos: entre amigos, trapacear não tem graça e os outros percebem.
- **Liga semanal:** ranking por **pontos de liga**, uma pontuação separada do XP pessoal e recalculada no servidor a partir das sessões sincronizadas. O servidor nunca aceita pontuação enviada pelo cliente.
- **Pontos de liga medem constância, não horas brutas.** O tempo é declarado pelo próprio estudante e não dá para verificar, então a liga não premia quem declara mais:
  - A base é o percentual da própria meta semanal cumprido, com teto em 100%. Quem estuda 10h com meta de 10h empata com quem estuda 40h com meta de 40h.
  - A meta que vale é o retrato salvo no início da semana; baixar a meta no meio da semana não muda a pontuação.
  - Só conta tempo medido pelo cronômetro do app. Tempo digitado à mão vale para o XP pessoal, não para a liga.
  - Bloco com cronômetro conta até 1,5 vez a duração planejada. Acima de 90 minutos seguidos, o app pede uma confirmação de presença.
  - Revisões em dia e simulados registrados somam pontos fixos.
- **XP pessoal continua generoso.** Ele só compete com o próprio estudante, então não precisa dessas travas além dos limites de sanidade.
- **Privacidade:** o perfil é privado por padrão; só apelido, retrato, nível e percentual da meta da semana são visíveis para a guilda. Nada de matérias, concurso ou anotações.

## Arquitetura

Tudo roda na Cloudflare. Antes de escrever código que toque em Workers, D1, Durable Objects ou Wrangler, consulte a documentação atual (https://developers.cloudflare.com/llms.txt): APIs e limites mudam e a memória fica desatualizada.

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Monorepo | Bun workspaces + Turborepo | Mesma divisão de hoje; pacotes consumidos como TypeScript, sem build. Bun só instala pacotes e roda scripts (`bun install`, `bun run`, `bunx wrangler`); não é runtime: em produção tudo roda no workerd. |
| Testes | Vitest em todos os pacotes; `@cloudflare/vitest-pool-workers` na API | Um executor só. Não use `bun test`: ele não roda no runtime de Workers. |
| App | React 19 + Vite + TanStack Router, SPA | Um código só para navegador, Android e iOS. |
| Mobile | Capacitor empacotando `apps/web` (fase posterior) | App nas lojas e acesso a APIs nativas sem reescrever a UI. |
| UI | Tailwind CSS v4 com os tokens do design system; primitivos acessíveis (Radix/shadcn) só para comportamento | A aparência é toda própria; o comportamento de diálogos, menus e foco vem pronto. |
| API | Hono em um Worker, com cliente tipado (`hc`) | Tipos de ponta a ponta sem geração de código. |
| Hospedagem do app | Static assets do mesmo Worker da API | Mesma origem na web: cookies de sessão simples e sem CORS. |
| Banco | D1 único + Drizzle ORM, migrações com drizzle-kit | SQLite gerenciado; cobre dados de usuários e o catálogo público. |
| Auth | Better Auth sobre D1 | E-mail e senha, Google, verificação e recuperação de senha, sem serviço externo. |
| E-mail | Cloudflare Email Service | Verificação e recuperação de senha. |
| Proteção | Turnstile no cadastro e rate limiting nas rotas de auth e sync | Cadastro aberto atrai abuso. |
| Arquivos | R2 | Exportações de dados. |
| Site | Astro estático, em Worker próprio | Continua sem lógica de app; linka para `/?conta=criar` e `/?conta=entrar`. |
| CI/CD | GitHub Actions + Wrangler para web, API e site, com ambientes `preview` e `production` | Cada PR ganha uma URL de prévia com D1 próprio. Não há pipeline para o app mobile. O repositório só existe no fim (seção "Preparação"): até lá, deploy manual com `bunx wrangler deploy --env preview` e os workflows já escritos em `.github/workflows`, prontos para ligar. |

Estrutura:

```text
apps/web                 SPA React
apps/api                 Worker Hono: auth, sync, catálogo, exportação, MCP
apps/site                Site de divulgação (Astro)
apps/mobile              Casca Capacitor (criada só na fase de mobile)
packages/domain          Modelos, regras de estudo e gamificação (puro)
packages/agent-context   Contrato de contexto, tarefas e propostas para IA externa
packages/db              Schema Drizzle e migrações do D1
packages/sync            Protocolo de sincronização, compartilhado entre web e api
packages/ui              Design system (tokens, componentes, arte)
```

Regra de dependência: `domain` não importa nada; `agent-context` depende de `domain` e Zod; `sync` e `db` dependem de `domain`; os apps dependem dos pacotes. Telas chamam funções de domínio e nunca reimplementam regra.

Um cliente nativo (React Native) pode surgir no futuro. Por isso, `domain`, `agent-context` e `sync` não importam nada de React, do DOM ou do Capacitor, e a API não assume que o cliente é um navegador.

### Dados e sincronização

O app é local-first: a tela lê e grava em um banco local e nunca espera a rede.

- **No cliente:** banco local com os dados e uma fila de mutações, atrás de uma interface de armazenamento (IndexedDB na web; SQLite no app mobile, quando ele existir). O estado continua sendo alterado só por funções de domínio; o diff entre o estado anterior e o próximo vira mutações na fila.
- **No servidor:** toda linha tem `user_id`, `updated_at`, `deleted_at` (exclusão lógica, para propagar a outros aparelhos) e `version`, um contador crescente por usuário atribuído pelo servidor.
- **Protocolo:** `POST /sync/push` envia um lote de mutações com id de idempotência; `GET /sync/pull?since=<version>` devolve só o que mudou desde o cursor. O sync atual baixa todas as tabelas a cada alteração; não repita isso.
- **Conflitos:** vence a última escrita por linha. Documente essa escolha e teste o caso de dois aparelhos offline.
- **Ordem das mutações:** pais antes dos filhos na inserção, filhos antes dos pais na exclusão.
- **Validação:** o servidor valida cada mutação com Zod. Uma mutação recusada volta para o cliente com o motivo; não é descartada em silêncio.

### Segurança

O D1 não tem RLS. A autorização passa a viver no Worker, então:

- Toda consulta a dados de usuário passa por uma camada de acesso que recebe o `userId` da sessão e o aplica sempre. Nenhuma rota monta consulta com `user_id` vindo do cliente.
- Escreva testes que tentam ler e alterar dados de outro usuário em cada rota.
- Na web, sessão em cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Segredos em secrets do Wrangler, nunca no repositório.
- Resposta de IA é dado não confiável: validar, mostrar prévia e aplicar só com confirmação.

### App mobile

O app Android e iOS é uma fase posterior e será lançado depois da web. Ele é o build de `apps/web` dentro de uma casca Capacitor. Não construa a casca agora, mas três decisões valem desde a fase 1, porque adaptar depois sai caro:

- **Auth aceita cookie e bearer.** No app, a origem é a do WebView, não a da API, então o cookie de mesma origem não serve. O app usará token de sessão guardado no armazenamento seguro do aparelho e enviado como bearer; a web continua com cookie.
- **Armazenamento local atrás de uma interface.** A web usa IndexedDB; o app usará SQLite, porque o sistema pode limpar o armazenamento de um WebView e a fila guarda estudo ainda não sincronizado.
- **Código de plataforma atrás de uma interface** em `apps/web/src/platform` (cronômetro em segundo plano, notificações, vibração, armazenamento seguro), com a implementação web agora e a Capacitor depois. Telas não verificam a plataforma diretamente.

Quando a fase chegar:

- **Cronômetro:** no Android, um plugin Capacitor próprio com serviço em primeiro plano e notificação com o tempo correndo e ação de pausar. Porte a lógica de `_old/apps/app/modules/study-timer`. No iOS, Live Activity fica para depois.
- **Avisos:** notificações locais agendadas para fim de bloco e revisões vencidas. Funcionam com o app fechado, sem servidor.
- **Login com Google** pelo fluxo nativo de ID token, sem abrir WebView de login. CORS só para as origens do app.
- **Comportamento de app:** áreas seguras, botão voltar do Android, teclado sem cobrir campos, deep links (`meuedital://` e links universais), tela de abertura e vibração nas comemorações.
- **Lojas:** exclusão de conta dentro do app e política de privacidade publicada no site são exigências da Play Store e da App Store.
- **Builds e publicação são manuais**, pelo Android Studio e pelo Xcode. Não crie automação de build ou de envio para as lojas.

### Cronômetro e avisos

O cronômetro guarda o instante de início e o tempo acumulado, não um contador, para sobreviver a recarregar e fechar o app. Na web, mostre o tempo no título da aba e use a Notification API para o fim de bloco com a aba aberta. Web Push para a web com a aba fechada fica para uma fase posterior.

### IA por MCP

O estudante conecta a IA que já usa (Claude, ChatGPT ou outra com suporte a MCP remoto) à conta dele, e a IA lê o contexto de estudo e propõe mudanças sem copiar e colar. O app continua sem chamar nenhuma API de IA paga: quem roda o modelo é o cliente do estudante. Na interface, essa área se chama Oráculo.

- **Servidor:** MCP remoto no Worker de `apps/api`, com transporte Streamable HTTP. Consulte a documentação atual da Cloudflare para MCP remoto e autorização antes de implementar.
- **Autorização:** OAuth com o login do próprio app. A tela de consentimento mostra o que a IA poderá ler e propor. O estudante vê e revoga conexões nas configurações.
- **Escopo agora: só a base.** Servidor, OAuth, uma ferramenta de leitura (`contexto_de_estudo`, o `StudyContext` versionado, com nomes legíveis e sem ids), uma de proposta (`propor_alteracoes`, com os schemas Zod de `agent-context`) e a caixa de propostas. Integrações específicas com cada cliente de IA e novas ferramentas ficam para depois; desenhe o registro de ferramentas para que adicionar uma seja criar um arquivo.
- **Ferramentas de proposta nunca alteram dados:** gravam uma proposta pendente e devolvem um link para o app.
- **Caixa de propostas:** no app, cada proposta aparece como antes → depois, com o motivo dado pela IA. O estudante aplica ou descarta; aplicar passa pelas funções de domínio e pelo sync normal. Propostas pendentes expiram em 7 dias.
- **Regra que não muda:** tudo que vem da IA é dado não confiável. Não existe ferramenta que escreva direto nos dados do estudante, nem mesmo para registrar sessão, porque sessão vale XP.
- **Limites:** rate limiting por usuário e por conexão, e tamanho máximo por proposta.
- **Copiar e colar:** `renderPrompt` continua disponível, e a resposta colada entra na mesma caixa de propostas. Os dois caminhos compartilham validação, prévia e aplicação.

## UI

A UI atual não deve ser copiada. A direção nova é **RPG de gestão aconchegante**: parece a sede de uma guilda em um jogo medieval desenhado à mão, não um painel de produtividade nem um app de idiomas.

O design já está definido. Antes de escrever qualquer tela, leia e abra no navegador:

- `docs/design-system/design-system.md`: princípios, regras de uso, componentes e estados, vocabulário, acessibilidade e o desenho de celular.
- `docs/design-system/tokens.css`: cores, tipografia, espaço e forma. É a fonte da verdade.
- `docs/design-system/index.html`: todos os componentes desenhados.
- `docs/mockups/dashboard-rpg.html`: a tela Início de desktop montada com eles.

Em resumo: folhas de pergaminho com contorno de tinta marrom, filete interno e sombra dura; parede em rosa queimado e viga de madeira no topo com os recursos do jogador; faixas e flâmulas nos títulos; cantos quase retos; paleta terrosa; títulos em Amatic SC e texto em Alegreya Sans; blocos do ciclo como cartas numeradas em romano; matérias com brasão e estrelas. O mascote é um axolote rosa de capelo.

Regras de trabalho:

- **Implemente o design system em `packages/ui` antes das telas:** tokens no `@theme` do Tailwind e um componente por arquivo, com os estados descritos no documento. Nenhuma cor ou medida aparece solta em uma tela.
- **Só a tela Início de desktop está desenhada.** Para cada tela nova (Estudar, Jornada, Revisões, Edital, Semana, Desempenho, Oráculo) e para a versão de celular, proponha o desenho com os componentes existentes e espere aprovação antes de construir. Se faltar um componente, proponha-o primeiro e acrescente-o ao documento.
- **Vocabulário:** Jornada (ciclo), Contratos do dia (missões), Chefe (simulado da volta), Guilda (amigos), Oráculo (IA). O restante mantém o nome comum. A tabela completa está no documento.
- **Retorno imediato:** toda ação de estudo responde na hora com XP subindo, barra enchendo e uma comemoração curta nos marcos. Respeite `prefers-reduced-motion`.
- **Sem padrões manipulativos:** nada de contagem regressiva falsa, culpa por ausência ou notificação insistente. Voltar depois de dias fora é recebido com "a jornada espera por você".
- **Desktop e celular são desenhos diferentes.** No desktop, navegação em lista na lateral esquerda, abaixo da ficha do jogador. No celular, barra inferior com cinco placas e Estudar em destaque no centro, jornada em fileira horizontal e detalhes em folha que sobe da base.
- **Acessibilidade:** navegação completa por teclado, foco visível e contraste AA. As combinações de cor permitidas e proibidas estão no documento; mantenha um teste automatizado de contraste sobre os tokens.
- **Fontes servidas pelo próprio app**, não por CDN, para funcionar offline e dentro do app mobile.
- **Separe lógica de apresentação:** cada tela tem um hook com estado e ações, sem JSX, e componentes que só desenham. Isso mantém a lógica reaproveitável se a UI for reescrita em React Native.
- Nenhum arquivo de tela com mais de ~300 linhas; quebre em componentes.
- Textos em português do Brasil, curtos e amigáveis, com humor leve. Emoji não aparece na interface.

### Arte

As ilustrações são geradas por IA de imagem, fora deste repositório, e entram como arquivos. O código não depende de elas existirem: cada ilustração tem um substituto vetorial simples, e trocar a arte é trocar um arquivo.

- **Personagens prontos:** `docs/design-system/personagens/` tem o axolote em quatro poses (parado, estudando, comemorando, dormindo) e quatro skins (rosa, dourado, selvagem, melanoide), três chapéus como camada separada (capelo, mago, coroa) e o chefe do simulado em duas poses, tudo em SVG, com `manifesto.json` e o gerador `gerar.mjs`. Copie a pasta para `packages/ui/art/` e use esses arquivos desde o início. A seção "Personagens" do design system explica quando usar cada pose.
- **Skins e chapéus são cosméticos:** skins são liberadas por nível e o chapéu acompanha a patente. O jogador escolhe a skin; a escolha é um dos poucos dados de gamificação armazenados.
- **Ícones e brasões:** os de `docs/design-system/index.html` são definitivos.
- **Onde ficam:** `packages/ui/art/`, com o manifesto que mapeia cada chave (`mascote.rosa.parado`, `chapeu.mago`, `chefe.derrotado`) para o arquivo. Componentes pedem a arte pela chave, nunca pelo caminho.
- **Formato da arte final:** PNG ou WebP com fundo transparente, em 1x e 2x, ou SVG. Deve manter as chaves, o quadro de 200 por 210 e a posição da cabeça, para os chapéus continuarem encaixando.
- **Ainda falta gerar:** um emblema por conquista, itens do gabinete e ilustrações de tela vazia.
- **Guia de estilo para os pedidos de imagem**, para manter tudo consistente: ilustração 2D desenhada à mão, com contorno de tinta marrom de espessura irregular e cores chapadas com pouca sombra, como um jogo de gestão medieval aconchegante; paleta terrosa da UI (pergaminho, vinho, verde-azulado, ouro, rosa queimado); sem degradês brilhantes nem aparência 3D; fundo transparente; retratos em moldura de arco. Gere todas as peças de um mesmo tipo na mesma sessão, usando o mascote aprovado como imagem de referência. Evite semelhança com mascotes de apps de estudo conhecidos.

## Qualidade

- Testes de domínio e de `agent-context` portados e ampliados para cada regra nova, incluindo todas as regras de XP, nível, contratos e conquistas.
- Testes da API rodando no runtime de Workers (`@cloudflare/vitest-pool-workers`), com D1 local.
- Testes do protocolo de sync: ida e volta, idempotência, exclusão, conflito, mutação recusada.
- Teste de contraste sobre os tokens do design system.
- Um teste de ponta a ponta com Playwright para o fluxo principal: criar conta, criar concurso, gerar ciclo, registrar sessão, ganhar XP, ver a semana.
- `bun run check` roda lint, typecheck e testes em todos os pacotes e é a definição de pronto. Para telas, confira também em largura de celular e de desktop.

## Fases

Entregue em fases, cada uma funcionando e publicada em `preview` antes da próxima. As fases 1 a 5 formam a primeira versão utilizável.

1. **Fundação:** monorepo, pacotes `domain` e `agent-context` portados com testes, schema do D1, Worker com auth completo (cookie e bearer), workflows de CI escritos e deploy manual da web e da API em `preview`.
2. **Sync:** protocolo, banco local atrás de interface, fila offline e testes.
3. **Gamificação no domínio:** XP, nível, patente, contratos, conquistas e eventos de comemoração, como funções puras com testes.
4. **Design system:** tokens e componentes de `docs/design-system` implementados em `packages/ui`, shell do app em desktop e celular, e desenhos das telas restantes aprovados.
5. **Núcleo:** onboarding, edital, jornada, estudar, revisões, início e semana, já com as correções 1 a 7 e a gamificação visível.
6. **Oráculo:** base do servidor MCP (OAuth, uma ferramenta de leitura, uma de proposta), caixa de propostas e copiar e colar como alternativa.
7. **Desempenho, simulados e exportação de dados.**
8. **Catálogo de editais, revisão adaptativa, reta final e gabinete.**
9. **Site de divulgação.**
10. **Guildas:** grupos por convite e liga semanal.
11. **Mobile:** casca Capacitor, auth por token, SQLite local, plugin do cronômetro no Android, notificações locais e deep links. Builds e publicação manuais.
12. **Web Push** na web.

## Como trabalhar

- Comece pela seção "Preparação". Depois leia o projeto antigo em `_old/` e o design system, e me apresente um plano da fase 1 antes de escrever código.
- Registre cada decisão de arquitetura em `docs/decisions/` com contexto, escolha e alternativas descartadas.
- Pergunte antes de decidir algo que mude o produto ou que seja caro de reverter (modelo de dados, protocolo de sync, auth, fórmula de XP, desenho de uma tela nova). O resto, decida, siga e registre.
- Escreva um `AGENTS.md` novo descrevendo comandos, estrutura e regras deste repositório.
- Ao fim da reconstrução, apague `_old/` e crie o repositório privado no GitHub (seção "Preparação").
- Trabalhe em branches; faça commits só quando eu pedir, com mensagens em português, no presente e em terceira pessoa.
