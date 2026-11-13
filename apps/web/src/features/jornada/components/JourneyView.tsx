import { BlockCard, Button, buttonClass, Icon, ListRow, Mascot, Sheet, Tag } from "@meu-edital/ui";
import { useLayout } from "@global/hooks/useLayout";
import { Link } from "@tanstack/react-router";
import type { Journey } from "../hooks/useJourney";
import { AddBlockSheet, CardSheet, RegenerateSheet } from "./JourneySheets";

/** Jornada: todas as cartas da volta. No celular, lista compacta. */
export function JourneyView({ journey }: { journey: Journey }) {
  const { mobile } = useLayout();
  const { view } = journey;
  if (!view)
    return (
      <Sheet title="Jornada" className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot pose="dormindo" className="w-36" />
          <p>Sem concurso, sem jornada. Vamos montar o seu?</p>
          <Link to="/comecar" className={buttonClass()}>
            Começar
          </Link>
        </div>
      </Sheet>
    );

  return (
    <Sheet title={`Jornada · volta ${view.lap}`} ribbonSize="lg" className="pt-[30px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-ink-muted">
          {view.cards.length} blocos · {view.lapTime} por volta (meta {view.target})
          {view.cards.length ? ` · bloco ${view.position + 1} agora` : ""}
        </span>
        <div className="flex gap-2">
          <Button variant="quiet" onClick={() => journey.setAdding(true)}>
            <span className="flex items-center gap-1">
              <Icon name="plus" className="size-4" /> Bloco
            </span>
          </Button>
          <Button variant="gold" onClick={() => journey.setRegenerating(true)}>
            Gerar pelos pesos
          </Button>
        </div>
      </div>
      {!view.cards.length && <p className="text-center text-ink-muted">A jornada está vazia. Gere pelos pesos ou acrescente blocos.</p>}
      {mobile ? (
        <div>
          {view.cards.map((card) => (
            <ListRow
              key={card.id}
              aside={card.state === "now" ? <Tag>agora</Tag> : card.state === "done" ? <Tag>feito</Tag> : undefined}
            >
              <button type="button" onClick={() => journey.select(card.id)} className="flex min-h-11 w-full items-center gap-3 text-left">
                <span className="font-title w-10 text-center text-xl">{card.numeral}</span>
                <span className={card.state === "now" ? "font-extrabold" : ""}>
                  {card.subject} <span className="text-xs text-ink-muted">{card.minutes} min</span>
                </span>
              </button>
            </ListRow>
          ))}
        </div>
      ) : (
        <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-3 gap-y-[22px]">
          {view.cards.map((card) => (
            <div key={card.id} className="grid">
              <BlockCard
                state={card.state === "now" ? "now" : card.state}
                numeral={card.numeral}
                subject={card.subject}
                subjectIndex={card.subjectIndex}
                minutes={card.minutes}
                onSelect={() => journey.select(card.id)}
                action={
                  card.state === "now" ? (
                    <Button variant="quiet" onClick={() => journey.select(card.id)}>
                      Editar
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ))}
        </div>
      )}
      <CardSheet journey={journey} />
      <AddBlockSheet journey={journey} />
      <RegenerateSheet journey={journey} />
    </Sheet>
  );
}
