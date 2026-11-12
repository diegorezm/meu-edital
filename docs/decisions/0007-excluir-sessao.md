# 0007 · "Estudado" derivado das sessões e efeitos de excluir uma sessão

**Contexto.** Era impossível corrigir uma sessão registrada errada. Ela mudava vários dados (assunto estudado, revisões, ciclo) sem deixar rastro.

**Escolha.**
- **"Estudado" não é guardado.** Um assunto está estudado quando tem pelo menos uma sessão (`isTopicStudied`, `studiedTopicIds`).
- **Vínculos nas revisões.** Cada revisão guarda a sessão que a agendou (`sessionId`). Quando concluída, guarda também a sessão de revisão que a concluiu (`completedBySessionId`).
- **Vínculo no concurso.** O concurso guarda a última sessão que avançou o ciclo (`lastCycleSessionId`).
- **`deleteSession`:**
  - remove as revisões que a sessão agendou;
  - reabre as revisões que ela concluiu;
  - se ela foi a última a avançar o ciclo, devolve a jornada ao bloco dela e desconta a volta, se ela tiver fechado uma.

  Pular, excluir ou substituir blocos apaga a referência da última sessão, e aí excluir aquela sessão não mexe mais na jornada.
- **`updateSession`** corrige minutos, questões, acertos, anotação e data. Mudar a data desloca as revisões agendadas pelo mesmo número de dias. Para trocar matéria, assunto, tipo ou bloco, exclua a sessão e registre de novo.

**Limite conhecido.** Se a primeira sessão de um assunto for excluída e ele tiver outras sessões, as revisões não são reagendadas a partir da seguinte.

**Descartado.**
- Desfazer qualquer avanço do ciclo: exigiria guardar o histórico completo da posição.
- Guardar `studied` e recalcular ao excluir: seriam duas fontes da verdade.
