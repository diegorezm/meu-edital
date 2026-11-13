# 0016. TanStack DB no cliente do sync

## Contexto

O cliente do sync era um motor próprio (`SyncEngine`). Ele guardava o `AppData` inteiro, salvava esse snapshot inteiro no IndexedDB (web) ou no SQLite (app) a cada alteração e avisava todas as telas a cada mudança. A fila de mutações, o merge com as linhas pendentes e a persistência eram código nosso. Os dados crescem com cada sessão de estudo, e como o app ainda não foi lançado, decidimos trocar isso agora por uma biblioteca consolidada.

## Decisão

**O servidor e o protocolo não mudam.** Push, pull, WebSocket, idempotência e a regra de que vence a última escrita seguem a [0010](0010-protocolo-de-sync.md) e a [0006](0006-conflitos-no-sync.md). A troca é só no cliente.

**Uma coleção do TanStack DB por tabela** (`@tanstack/db`), em `packages/sync/src/client.ts`, que entra pelo subcaminho `@meu-edital/sync/client` para não ir parar no Worker.
- Um sync próprio puxa `GET /pull?since=` e grava cada página nas coleções com `begin/write/commit`.
- O cursor fica no metadado de cada coleção, gravado junto com as linhas.
- O que está pendente aparece por cima do que foi sincronizado (camada otimista do DB). Isso substitui o antigo `applyPulled`.

**O domínio continua puro.** `store.update(fn)` monta o `AppData` a partir das coleções e roda `fn`. O `diffData` transforma a diferença em `insert/update/delete`, aplicados numa transação só.

**Fila offline** com `@tanstack/offline-transactions`. Cada transação é guardada (IndexedDB na web, SQLite no app) e enviada a `POST /push`.
- Os ids das mutações saem da chave de idempotência, então reenviar não aplica duas vezes.
- Sem rede, a transação espera e tenta de novo. Outro erro não é retentado.
- Recusas parciais aparecem para o estudante, e o pull seguinte traz a versão do servidor.

**Persistência por linha** em SQLite:
- web: `@tanstack/browser-db-sqlite-persistence`, com OPFS e coordenador entre abas;
- app: `@tanstack/capacitor-db-sqlite-persistence`.

Sem OPFS, os dados ficam em memória: o app funciona online, mas não abre offline.

**Leitura.** `useStore().data` continua existindo para as funções de domínio que pedem o `AppData` inteiro. Componentes que leem só algumas linhas usam `useLiveQuery` (`src/global/store/queries.ts`) e só renderizam quando essas linhas mudam.

## Consequências

- Gravamos por linha, e não o snapshot inteiro a cada alteração.
- Saem o `SyncEngine`, o `merge.ts`, o `enqueue` e os bancos locais próprios.
- Dependemos de versões RC do TanStack DB, fixadas no `package.json`. Atualizar exige rodar os testes de `packages/sync`.
- A espera pelo carregamento local antes do primeiro pull usa `metadata.persistence.hydrateBaseline()`, que a biblioteca marca como interna. Se ela mudar, o efeito é só refazer o pull desde 0.
- Não há migração dos dados locais antigos: no primeiro acesso depois da troca, o pull completo refaz tudo.
