import { BottomSheet, Button, Field, Icon, SelectField } from "@meu-edital/ui";
import { useState } from "react";
import type { Journey } from "../hooks/useJourney";

/** Folha de uma carta: minutos, mover, pular para ela e excluir. */
export function CardSheet({ journey }: { journey: Journey }) {
  const { card } = journey;
  const [minutes, setMinutes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const total = journey.view?.cards.length ?? 0;
  return (
    <BottomSheet
      open={Boolean(card)}
      onOpenChange={(open) => {
        if (!open) {
          journey.select(null);
          setMinutes("");
          setConfirming(false);
        }
      }}
      title={card ? `Bloco ${card.numeral}` : "Bloco"}
      description={card ? card.subject : undefined}
    >
      {card && (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <Field
              className="flex-1"
              label="Minutos"
              type="number"
              min={5}
              max={600}
              value={minutes || card.minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            <Button onClick={() => journey.setMinutes(card.id, Number(minutes || card.minutes))}>Salvar</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="quiet" disabled={card.index === 0} onClick={() => journey.move(card.id, -1)}>
              Antes
            </Button>
            <Button variant="quiet" disabled={card.index === total - 1} onClick={() => journey.move(card.id, 1)}>
              Depois
            </Button>
            {card.state !== "now" && (
              <Button
                variant="quiet"
                onClick={() => {
                  journey.skipTo(card.id);
                  journey.select(null);
                }}
              >
                Pular para cá
              </Button>
            )}
          </div>
          {confirming ? (
            <div className="flex flex-col gap-2">
              <p className="font-bold">Excluir este bloco? Seu estudo registrado continua salvo.</p>
              <div className="flex gap-2">
                <Button variant="quiet" className="flex-1" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={() => journey.remove(card.id)}>
                  Excluir
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex min-h-11 items-center gap-1.5 self-start font-bold text-rose-strong"
            >
              <Icon name="trash" /> Excluir bloco
            </button>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

export function AddBlockSheet({ journey }: { journey: Journey }) {
  const subjects = journey.view?.subjects ?? [];
  const [subjectId, setSubjectId] = useState("");
  const [minutes, setMinutes] = useState("60");
  return (
    <BottomSheet open={journey.adding} onOpenChange={journey.setAdding} title="Novo bloco">
      <div className="flex flex-col gap-3">
        <SelectField
          label="Matéria"
          value={subjectId || subjects[0]?.id || ""}
          onChange={(e) => setSubjectId(e.target.value)}
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Field label="Minutos" type="number" min={5} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <Button onClick={() => journey.add(subjectId || subjects[0]?.id || "", Number(minutes))}>Acrescentar</Button>
      </div>
    </BottomSheet>
  );
}

export function RegenerateSheet({ journey }: { journey: Journey }) {
  return (
    <BottomSheet
      open={journey.regenerating}
      onOpenChange={journey.setRegenerating}
      title="Gerar pelos pesos"
      description="Refaz a jornada pela meta semanal e pelos pesos, aproveitamento e revisões de cada matéria. A volta recomeça do primeiro bloco; o estudo registrado continua salvo."
    >
      <div className="flex gap-2">
        <Button variant="quiet" className="flex-1" onClick={() => journey.setRegenerating(false)}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={journey.regenerate}>
          Gerar
        </Button>
      </div>
    </BottomSheet>
  );
}
