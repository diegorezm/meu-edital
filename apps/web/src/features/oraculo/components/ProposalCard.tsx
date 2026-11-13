import { Button, Notice } from "@meu-edital/ui";
import type { Oracle } from "../hooks/useOracle";

type Card = Oracle["cards"][number];

/** Uma proposta: quem propôs, o motivo e cada alteração como antes → depois. */
export function ProposalCard({ card, oracle }: { card: Card; oracle: Oracle }) {
  const { proposal } = card;
  return (
    <article className="mb-3 rounded-[6px] border-2 border-ink bg-paper-raised px-3 py-2.5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-extrabold">
          {card.title} · {card.when}
        </h3>
        <span className="text-xs text-ink-muted">{card.expires}</span>
      </header>
      <p className="my-1.5 text-sm">"{proposal.reason}"</p>
      {card.problem ? (
        <Notice tone="error">{card.problem}</Notice>
      ) : (
        <dl>
          {card.preview.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b-[1.5px] border-dashed border-rule py-1 text-sm last:border-b-0">
              <dt>{item.title}</dt>
              <dd className="text-ink-muted line-through">{item.before}</dd>
              <dd className="font-extrabold">→ {item.after}</dd>
              {item.reason && <dd className="col-span-3 text-xs text-ink-muted">{item.reason}</dd>}
            </div>
          ))}
        </dl>
      )}
      <div className="mt-2.5 flex justify-end gap-2">
        <Button variant="quiet" disabled={oracle.busy === proposal.id} onClick={() => void oracle.discard(proposal)}>
          Descartar
        </Button>
        {!card.problem && (
          <Button disabled={oracle.busy === proposal.id} onClick={() => void oracle.apply(proposal)}>
            Aplicar
          </Button>
        )}
      </div>
    </article>
  );
}
