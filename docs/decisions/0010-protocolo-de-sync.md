# 0010 · Protocolo de sync

**Contexto.** O app é local-first: a tela nunca espera a rede, e o estudo feito offline precisa chegar ao servidor depois. O sync antigo baixava todas as tabelas a cada alteração.

**Escolha.**
- **Pacote `packages/sync`.** É puro e serve à web e a um futuro cliente nativo. Ele tem:
  - os schemas Zod das linhas;
  - `diffData` (estado anterior → mutações);
  - `applyPulled` (junta o que veio do servidor);
  - o `SyncEngine`, que fala com o banco local (`LocalStore`) e com a rede (`Transport`) por interfaces.
- **Mutação.** É `{ id, table, op: upsert | delete, rowId, row }`. O `id` garante idempotência: o servidor guarda os ids aplicados em `sync_mutations` por 30 dias.
- **Fila.** Uma linha com mutação pendente fica só com a mais recente. Os lotes saem em ordem segura (`orderBatch`): inserções dos pais para os filhos e exclusões dos filhos para os pais.
- **`POST /api/sync/push`.**
  - Valida cada linha e grava tudo em um único `batch` do D1, que é atômico.
  - Cada mutação aceita incrementa `sync_counters` e grava a linha com essa `version`.
  - A exclusão é lógica (`deleted_at`).
  - A resposta separa `accepted` e `rejected`, com o motivo. Uma recusa sai da fila e fica visível ao estudante em `rejected`; nunca some em silêncio.
- **`GET /api/sync/pull?since=`** devolve as linhas com `version` maior que o cursor, em páginas de 500.
- **Conflito.** Ver [0006](0006-conflitos-no-sync.md). Ao aplicar um pull, linhas com mutação local pendente são puladas até serem enviadas.
- **Preferências.** As preferências do usuário (concurso ativo, intervalos de revisão) são uma linha `userSettings` com id `me` no protocolo e id do usuário no banco.
- **Quando o app web sincroniza** (`global/store/StoreProvider.tsx`):
  - ao abrir;
  - 0,8 s depois de uma alteração;
  - ao voltar a rede ou a aba;
  - a cada minuto;
  - quando chega o aviso pelo WebSocket ([0008](0008-tempo-real-durable-objects.md)).
- **Banco local.** IndexedDB, uma entrada por usuário (`dados-<userId>`), atrás de `platform.localStore`. Se o IndexedDB estiver bloqueado, cai para memória. Excluir a conta apaga o banco local.

**Pendências conhecidas.**
- O WebSocket usa o cookie de sessão. O app mobile, que usa bearer, precisará passar o token de outro jeito (por exemplo, um ticket curto).
- O servidor não verifica se os pais existem: a integridade é do domínio ([0003](0003-d1-drizzle.md)).

**Descartado.**
- Baixar tudo a cada mudança: era o sync antigo, caro e lento.
- Sincronização por operação de domínio, como "registrar sessão" no servidor: duplicaria a regra no servidor e complicaria o offline.
