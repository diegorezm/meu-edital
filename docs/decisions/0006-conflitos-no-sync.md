# 0006 · Conflitos: vence a última escrita que chega ao servidor

**Contexto.** Dois aparelhos podem editar a mesma linha offline.

**Escolha.**
- Vence a última escrita de cada linha, na ordem em que as mutações chegam ao servidor.
- Cada escrita aceita recebe o próximo `version` do usuário. O relógio dos aparelhos não decide nada.
- O protocolo tem um teste do caso de dois aparelhos offline.
- Dois aparelhos podem criar o mesmo retrato semanal da meta (`week_targets`). Nesse caso, o domínio usa o de menor id (`savedWeekTarget`).

**Descartado.**
- Vencer pelo `updated_at` do aparelho: respeita quem editou por último de verdade, mas sofre com relógio errado.
- CRDT por campo: complexo demais para os dados de um único estudante.
