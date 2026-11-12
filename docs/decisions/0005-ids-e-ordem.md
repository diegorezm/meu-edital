# 0005 · Ids UUIDv7 e ordem explícita por `position`

**Contexto.** No projeto antigo, a ordem dos assuntos dependia da ordem alfabética de ids gerados por timestamp.

**Escolha.**
- `uid()` gera UUIDv7 no próprio aparelho, o que permite criar registros offline.
- A ordem de exibição vem de campos explícitos:
  - `position` nas matérias e nos assuntos (entre irmãos);
  - `order` nos blocos do ciclo.
- Empate em `position` é desfeito pelo id.

**Descartado.**
- Ordem pelo id: frágil, quebra ao importar ou reordenar.
- Ordenação fracionária: desnecessária enquanto a reordenação for pequena.
