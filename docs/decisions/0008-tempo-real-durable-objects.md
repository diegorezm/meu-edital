# 0008 · Tempo real com um Durable Object por usuário

**Contexto.** Um estudo registrado em um aparelho deve aparecer nos outros sem recarregar a página. O Convex foi considerado: daria tempo real e dispensaria o protocolo de sync. Foi descartado porque é online-first e não guarda fila offline, que o produto exige.

**Escolha (implementação na fase 2).**
1. Um Durable Object por usuário mantém as conexões WebSocket dos aparelhos dele, com hibernação.
2. Depois de um push, o Worker avisa o DO da nova `version`.
3. O DO repassa o aviso aos outros aparelhos.
4. Cada aparelho busca as mudanças com `GET /sync/pull?since=`.

O WebSocket só leva avisos e os dados vêm sempre pelo pull, então uma conexão perdida não perde nada. Na fase das guildas, um DO por guilda mantém a liga ao vivo.

**Descartado.**
- Convex: online-first.
- Polling: mais latência e mais custo.
- Dados do usuário dentro do DO: ver [0003](0003-d1-drizzle.md).
