# Design system · Guilda de pergaminho

Linguagem visual do Meu Edital. Dois arquivos:

- `tokens.css`: cores, tipografia, espaço e forma. É a fonte da verdade.
- `index.html`: página de referência com todos os componentes desenhados. Abra no navegador.

## Conceito

O app parece a sede de uma guilda em um jogo de gestão medieval desenhado à mão. O estudante é um aventureiro, o edital é a campanha e cada bloco de estudo é uma etapa da jornada.

Quatro princípios, em ordem de prioridade:

1. **Clareza antes do tema.** A tela responde "o que eu estudo agora?" em um olhar. Se um enfeite atrapalha essa resposta, ele sai.
2. **Papel e tinta, não plástico.** Folhas de pergaminho, contorno marrom, sombra dura. Nada de degradê brilhante, vidro, desfoque ou cantos muito redondos.
3. **Recompensa visível.** Todo estudo mostra o que rendeu: XP, carimbo, estrela.
4. **Calmo.** Paleta terrosa, pouca animação, sem urgência fabricada.

O que evitar, porque já foi testado e descartado: aparência de app de idiomas (cores pastel saturadas, botões gordos e arredondados, mascote verde, emoji como ícone).

## Cores

Valores em `tokens.css`. Regras de uso:

| Papel | Token | Uso |
| --- | --- | --- |
| Cenário | `--wall`, `--wood` | Fundo atrás das folhas e viga do topo. Nunca recebem texto corrido. |
| Folha | `--paper` | Superfície padrão de qualquer painel. |
| Elevado | `--paper-raised` | Cartas, campos e itens sobre a folha. |
| Afundado | `--paper-sunken` | Carta bloqueada, trilho de barra, selo neutro. |
| Tinta | `--ink` | Texto e **todo** contorno. Não existe contorno de outra cor, exceto o carimbo. |
| Tinta suave | `--ink-muted` | Texto secundário. |
| Ação | `--teal-strong` | Botão principal e faixa de título principal. Um por tela. |
| Recompensa | `--gold` | XP, moeda, carta atual, estrela cheia, botão secundário. Texto sobre ouro é `--ink`. |
| Identidade | `--maroon` | Item de navegação ativo, faixa do nome, chefe. |
| Concluído | `--green-strong` | Carimbo e marca de feito. |
| Atraso | `--rose-strong` | Revisão vencida, erro de formulário. |

Cada acento tem duas versões. A normal (`--teal`, `--rose`, `--green`) é decorativa: barras de gráfico, brasões, fundos de retrato. A `-strong` é a única que pode ser texto ou receber texto claro.

**Matérias** usam `--subject-1` a `--subject-8`, atribuídas pela ordem de criação e repetidas em ciclo. A cor nunca é a única identificação: toda matéria aparece com brasão e nome ou sigla.

Tema único, claro. Não há tema escuro nesta versão.

## Tipografia

| Estilo | Fonte | Tamanho | Uso |
| --- | --- | --- | --- |
| Título de faixa | Amatic SC 700, caixa alta | 27 a 30 px | Título de painel dentro de faixa |
| Título de seção | Amatic SC 700, caixa alta | 22 a 24 px | Cabeçalho de folha, botão |
| Numeral | Amatic SC 700 | 20 a 40 px | XP, horas, número romano do bloco |
| Corpo forte | Alegreya Sans 700/800 | 14 a 15 px | Nome de matéria, item de lista, navegação |
| Corpo | Alegreya Sans 500 | 15 px | Texto corrido |
| Apoio | Alegreya Sans 500 | 12 a 13 px | Legenda, dica, unidade |

Regras:

- A fonte de título é condensada e difícil de ler pequena. Mínimo de 20 px, no máximo quatro palavras, nunca em texto corrido nem em campo de formulário.
- Todo numeral em fonte de título vem acompanhado da unidade em fonte de corpo: **12h05** de 20h.
- Blocos da jornada são numerados em romano. Qualquer outro número é arábico.
- Espaçamento entre letras de `0.05em` na fonte de título.

## Superfícies e profundidade

- **Folha (`sheet`):** `--paper`, contorno de 2 px em `--ink`, raio de 6 px, filete interno (`--inset-rule`) e sombra dura (`--shadow-sheet`). Todo conteúdo vive em uma folha.
- **Profundidade é sempre sombra dura deslocada**, nunca desfoque. Há dois níveis: a folha sobre a parede e o botão sobre a folha (`--shadow-press`).
- **Pressionar** move o elemento 3 px para baixo e remove a sombra, em 80 ms.
- Folhas não se aninham. Dentro de uma folha, agrupe com cartas (`--paper-raised`) ou divisórias tracejadas em `--rule`.

## Componentes

Cada um está desenhado em `index.html` com seus estados.

**Faixa (`ribbon`).** Título pendurado no topo de uma folha, com as pontas cortadas em V. Verde-azulado para o painel principal da tela, ouro para painéis secundários, vinho para o nome do jogador. No máximo uma faixa por folha.

**Flâmula (`pennant`).** Etiqueta com a base cortada em V. Usada para o nome sob um retrato ou brasão.

**Botão.** Três variantes: principal (`--teal-strong`, texto claro), secundário (`--gold`, texto em tinta) e discreto (papel, só contorno). Texto em fonte de título, uma ou duas palavras, verbo no infinitivo: Partir, Revisar, Registrar. Só um botão principal por tela.

**Carta de bloco.** A unidade da jornada. Sempre tem numeral romano na aba, brasão ou ícone, matéria, assunto e rodapé. Estados:

| Estado | Fundo | Marca | Rodapé |
| --- | --- | --- | --- |
| Concluída | `--card-done` | Brasão | Carimbo "Concluída" |
| Atual | `--card-now`, filete e halo de ouro | Brasão | Tempo, recompensa e botão Partir |
| Próxima | `--paper-sunken`, texto suave | Cadeado de ouro | Tempo e recompensa |
| Chefe | `--card-boss`, aba em vinho | Caveira | Recompensa |

O cadeado significa "ainda não chegou a vez", não "proibido": tocar em uma carta próxima oferece pular para ela.

**Selo de recompensa (`tag`).** Pequeno retângulo com ícone e valor: tempo, XP. Usado em cartas e contratos.

**Recurso.** Placa na viga do topo com ícone, numeral e unidade. No máximo cinco. São informativos e levam à tela correspondente.

**Ficha do jogador.** Retrato em moldura de arco, faixa com o nome, patente e nível, barra de XP segmentada e seletor de concurso.

**Barra de XP.** Trilho em `--paper-sunken`, preenchimento em ouro, marcas a cada 10%. Sempre com o valor em texto ao lado ou abaixo.

**Navegação.** No desktop, lista vertical em uma folha, com ícone e nome. O item ativo é uma placa em vinho com texto claro. Contadores ficam à direita em um selo.

**Contrato.** Linha com caixa de marcação, descrição e recompensa. Os contratos são concluídos pelo estudo, não por clique: a caixa não é um controle.

**Atributo de matéria.** Retrato com brasão, flâmula com o nome, cinco estrelas de nível e uma linha de apoio.

**Carimbo.** Texto em fonte de título com contorno de 2 px em `--green-strong`, girado 5 graus. Só para "Concluída".

**Lista com divisória.** Linhas separadas por tracejado em `--rule`, com o valor ou prazo à direita.

**Campo de formulário.** Fundo `--paper-raised`, contorno em tinta, rótulo acima em corpo forte. Erro em `--rose-strong` abaixo do campo.

## Ícones e brasões

- Ícones são de traço, 24 por 24, espessura 2, pontas arredondadas, na cor do texto. O conjunto base está em `index.html`.
- Preenchimento só para dar significado: moeda em ouro, chama em rosa, cadeado em ouro.
- Emoji não é ícone e não aparece na interface.
- O brasão é um escudo na cor da matéria, com contorno em tinta e a sigla de duas letras em fonte de título, sempre em `--ink`.

## Personagens

Os personagens estão em `personagens/`, um SVG por arquivo, todos no mesmo quadro de 200 por 210. Abra `personagens/galeria.html` para ver o conjunto.

- O mascote é um **axolote de capelo**, com contorno de tinta. Ele é o retrato do jogador e aparece em telas vazias e comemorações.
- Retratos ficam em moldura de arco com fundo verde-azulado escuro e filete de ouro.

**Poses** (`axolote/axolote-<skin>-<pose>.svg`):

| Pose | Quando usar |
| --- | --- |
| `parado` | Retrato, ficha do jogador, estado padrão |
| `estudando` | Cronômetro rodando, tela Estudar |
| `comemorando` | Subir de nível, fechar a volta, conquista |
| `dormindo` | Telas vazias, volta depois de dias fora, offline |

**Skins:** `rosa` (padrão), `dourado`, `selvagem` e `melanoide`, que são variações reais de axolote. São só aparência, liberadas por nível, e o jogador escolhe qual usar.

**Chapéus** (`chapeus/chapeu-<nome>.svg`): `capelo`, `mago` e `coroa`. São uma camada separada, no mesmo quadro, sobreposta ao corpo. Nenhuma pose desloca a cabeça, então qualquer chapéu encaixa em qualquer skin e pose. O chapéu acompanha a patente.

**Chefe do simulado** (`chefe/`): `ameacando`, na carta do chefe, e `derrotado`, depois de registrar o simulado.

Como usar e estender:

- `personagens/manifesto.json` mapeia cada chave (`mascote.rosa.parado`, `chapeu.mago`, `chefe.derrotado`) para o arquivo. Componentes pedem a arte pela chave, nunca pelo caminho.
- Os arquivos são gerados por `personagens/gerar.mjs`. Para uma skin nova, acrescente uma paleta; para um chapéu novo, um desenho. Não edite os SVGs à mão.
- Estes vetores são a arte de partida. Quando houver ilustração final, ela substitui os arquivos mantendo as chaves, o quadro e a posição da cabeça.
- Estilo para ilustrações novas: 2D desenhado à mão, contorno marrom, cores chapadas, paleta do sistema, fundo transparente.

## Vocabulário

O tema aparece nos nomes só onde não atrapalha o entendimento.

| No app | Significa |
| --- | --- |
| Jornada | Ciclo de estudos |
| Volta | Uma passagem completa pelo ciclo |
| Contratos do dia | Missões diárias |
| Chefe | Simulado ao fim da volta |
| Guilda | Turma de amigos |
| Oráculo | IA externa e caixa de propostas |
| Patente | Faixa de níveis do jogador |

Mantêm o nome comum: Início, Estudar, Revisões, Simulados, Edital, Matérias, Desempenho, Conquistas, Semana.

Tom dos textos: português do Brasil, curto, amigável, com humor leve. Sem culpa por ausência: "faltou um dia? a jornada espera por você."

## Movimento

- Pressionar: 80 ms. Transições de estado: 180 ms. Curva `--ease-out-soft`.
- Troca de tela: a página sobe 8 px e aparece (`animate-rise`, 220 ms).
- Listas de cartas e linhas entram em cascata (`stagger`): 30 ms entre itens, até o oitavo.
- Cartas se levantam 2 px no hover (`lift`), só onde há mouse.
- Números da viga contam até o valor novo (`CountUp`, 600 ms). Na carga, aparecem direto.
- Ao registrar estudo: a barra de XP enche com um brilho, o carimbo cai na carta e a marca do contrato salta. Só em mudanças, nunca na carga.
- Folhas sobem da base no celular; no desktop, o diálogo aparece com leve escala. Ambos saem com animação.
- Comemorações (subir de nível, fechar a volta, conquista) são a única animação longa: até 1,2 s, uma vez, e podem ser puladas.
- Nada pisca ou se move em repouso, exceto o halo da carta atual e a respiração do mascote na tela inicial (`<Mascot idle />`).
- Com `prefers-reduced-motion`, tudo vira troca instantânea.

## Acessibilidade

Contrastes das combinações permitidas, calculados pela fórmula da WCAG. O mínimo é 4,5 para texto normal e 3 para texto grande e elementos gráficos.

| Texto | Fundo | Contraste |
| --- | --- | --- |
| `--ink` | `--paper` | 7,8 |
| `--ink-muted` | `--paper` | 5,6 |
| `--ink-muted` | `--paper-sunken` | 4,9 |
| `--paper-raised` | `--teal-strong` | 4,6 |
| `--paper-raised` | `--maroon` | 7,7 |
| `--ink` | `--gold` | 5,0 |
| `--green-strong` | `--card-done` | 4,7 |
| `--rose-strong` | `--paper` | 4,7 |
| `--ink` (sigla do brasão, texto grande) | `--subject-1` a `--subject-8` | 3,0 a 5,0 |

Combinações proibidas por falharem: texto claro sobre `--teal` (2,8) ou sobre qualquer cor de matéria (2,3 a 3,2), texto em `--rose` sobre papel (2,5), e o marrom claro `#9a7b6c` como texto (3,1).

As cores de matéria têm contraste baixo com o papel (1,6 a 2,6). Por isso nunca aparecem como texto nem como forma sem contorno: brasões, barras e molduras nessas cores sempre levam contorno em tinta.

Outras regras:

- Foco visível em todo elemento interativo: `--focus-ring` com `--focus-offset`.
- Área de toque mínima de 44 por 44 px no celular.
- Estado nunca depende só de cor: concluída tem carimbo, atual tem botão, próxima tem cadeado, matéria tem sigla.
- Um teste automatizado de contraste roda sobre os tokens; mudar uma cor exige que ele passe.

## Celular

O celular é um desenho próprio, com os mesmos componentes:

- **Topo:** viga com três recursos (XP, semana, revisões) e o retrato do jogador, que abre a ficha.
- **Jornada:** as cartas ficam em uma fileira horizontal com rolagem, centrada na carta atual, que é maior.
- **Navegação:** barra inferior com cinco placas: Início, Jornada, Estudar (ao centro, em destaque), Revisões e Mais. "Mais" abre uma folha com o restante.
- **Painéis secundários** (contratos, semana, matérias) empilham abaixo da jornada, cada um em sua folha.
- Detalhes e formulários abrem em folha que sobe da base.

## Implementação

- Os tokens entram no Tailwind v4 por `@theme`, com os mesmos nomes (`--color-paper`, `--color-ink`, `--font-display`...). Nenhuma cor ou medida aparece solta em componente.
- Os componentes vivem em `packages/ui`, um arquivo por componente, com os estados descritos aqui.
- As fontes são servidas pelo próprio app (arquivos locais), não por CDN, para funcionar offline e dentro do app mobile.
- O efeito de contorno em formas recortadas (faixa, flâmula) usa `filter: drop-shadow` em um elemento pai, porque `clip-path` corta a borda.

## No código

Os componentes acima vivem em `packages/ui/src/components`, um por arquivo:

| Componente | Arquivo |
| --- | --- |
| Folha | `Sheet` (com `title` vira faixa pendurada) |
| Faixa e flâmula | `Ribbon`, `Pennant` |
| Botão e campo | `Button`, `Field` |
| Carta de bloco | `BlockCard` (estados `done`, `now`, `next`, `boss`; `toRoman` para o numeral) |
| Selo, carimbo e contador | `Tag`, `Stamp`, `Badge` |
| Recurso e placa de data | `Resource`, `DatePlate` |
| Ficha | `Portrait`, `Mascot` (corpo + chapéu), `XpBar` |
| Navegação | `navItemClass` + `NavItemContent` (lateral), `tabItemClass` + `TabItemContent` (barra inferior) |
| Contrato e listas | `ContractRow`, `CheckBox`, `ListRow`, `SheetHead` |
| Matéria | `Crest` (brasão com sigla), `SubjectAttribute`, `Stars` |
| Folha que sobe da base | `BottomSheet` (diálogo centrado no desktop; comportamento do Radix) |
| Ícones | `Icon`: o conjunto base mais ícones de ação no mesmo traço (mais, fechar, editar, excluir, tocar, pausar, voltar, sair, sincronizar) |
