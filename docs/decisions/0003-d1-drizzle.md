# 0003 · D1 com Drizzle, sem chaves estrangeiras entre tabelas de estudo

**Contexto.** O D1 não tem RLS. O app é local-first, então as mutações chegam de vários aparelhos e fora de ordem.

**Escolha.**
- **Schema e migrações.** O schema fica em `packages/db/src/schema.ts` (Drizzle). O `drizzle-kit generate` cria o SQL em `packages/db/migrations`, e o Wrangler aplica com `wrangler d1 migrations apply`.
- **Campos de sync.** Toda tabela de estudo tem:
  - `user_id`;
  - `updated_at`, em milissegundos;
  - `deleted_at`, para a exclusão lógica;
  - `version`, um contador por usuário atribuído pelo servidor.

  Um índice em `(user_id, version)` atende o pull.
- **Chaves estrangeiras.** Só `user_id` tem chave estrangeira, para `user` com `on delete cascade`: excluir a conta apaga tudo. Entre as tabelas de estudo não há chave estrangeira, porque um filho pode chegar antes do pai e a exclusão é lógica. Quem garante a integridade é o domínio, que exclui em cascata (`removeExam` etc.).
- **Autorização no Worker.** Toda consulta passa por `userData(db, userId)` (`apps/api/src/data/access.ts`), que aplica o `userId` da sessão.

**Descartado.**
- Chaves estrangeiras entre as tabelas de estudo: recusariam mutações válidas que chegam fora de ordem.
- Guardar os dados de cada usuário no SQLite de um Durable Object: as escritas ficariam em fila, mas as migrações e as consultas entre usuários (liga das guildas) ficariam mais difíceis. Pode ser revisto se o D1 virar gargalo.
