# 0011 · Gamificação derivada do estudo

**Contexto.** A regra do produto é que só estudo de verdade dá recompensa. Editar ou excluir uma sessão precisa corrigir tudo sozinho.

**Escolha.**
- **Nada do jogo é guardado**, exceto a skin escolhida (`skin`) e as comemorações já vistas (`seenCelebrations`), que viajam na linha de preferências do sync. O resto é calculado por funções puras em `packages/domain/src/game/`:
  - XP, nível, patente e chapéu;
  - ofensiva semanal;
  - estrelas das matérias;
  - contratos do dia;
  - conquistas;
  - comemorações.
- **Tabela de XP** (`game/constants.ts`), exatamente a do plano:
  - 1 XP por minuto;
  - +2 por acerto;
  - +20 por revisão no dia do vencimento;
  - +200 por volta;
  - +300 por semana com a meta batida.
  - Limites: uma sessão conta até 6 h e um dia, até 16 h.
- **Revisão "em dia"** é a concluída no próprio dia do vencimento. Uma sessão de revisão só conclui revisões já vencidas, então não existe revisão antecipada.
- **Curva de níveis:** o nível `n` exige 50 × n × (n − 1) XP. Com 20 h por semana, o nível 10 chega em 2 a 3 semanas e o 30, em cerca de 5 meses.
- **Patentes:**

  | A partir do nível | Patente |
  | --- | --- |
  | 1 | Estagiário |
  | 5 | Técnico |
  | 10 | Analista |
  | 20 | Auditor |
  | 30 | Procurador |
  | 45 | Juiz |
  | 60 | Desembargador |
  | 80 | Ministro |

- **Chapéus:** capelo (1), mago (20) e coroa (45).
- **Skins:** rosa (1), dourado (10), selvagem (20) e melanoide (30), como na galeria.
- **Contratos do dia** são calculados com o estado de antes do dia, para não mudarem enquanto o estudante estuda:
  1. concluir 1 bloco;
  2. fazer até 3 revisões que já estavam vencidas, ou, sem revisões vencidas, estudar 1 assunto novo;
  3. resolver 10 questões na matéria de pior aproveitamento das últimas 6 semanas (ou, sem questões, na de menor cobertura).
- **Contratos não dão XP extra:** o selo mostra o XP que o próprio estudo costuma render. Assim a tabela de XP continua sendo a única regra.
- **Ofensiva:** conta semanas seguidas com a meta batida. A semana em andamento soma quando a meta já foi batida e nunca quebra a sequência antes de terminar.
- **Estrelas da matéria:** 60% cobertura e 40% aproveitamento nas últimas 6 semanas, de 1 a 5.
- **Comemorações:** `celebrationsBetween(antes, depois)` compara os estados e devolve os eventos novos (nível, volta, meta da semana, conquista), com ids estáveis. `markCelebrationsSeen` evita repetir a comemoração em outro aparelho.

**Em aberto (decidir quando as telas chegarem).**
- O mockup mostra contratos com bônus (+50, +40, +60) e o chefe com +500. Hoje os contratos mostram o XP estimado do estudo, e o simulado ainda não dá XP (fase 7). Para dar bônus, acrescente as regras em `XP`, com testes.

**Descartado.** Guardar o XP no banco: dessincroniza ao editar sessões e impede mudar a fórmula. Sequência diária: contradiz "faltar um dia não pune" e incentiva sessões de dois minutos.
