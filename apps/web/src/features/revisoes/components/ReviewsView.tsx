import { BottomSheet, Button, Chip, Crest, Field, ListRow, Mascot, Sheet, Tag } from "@meu-edital/ui";
import { useState } from "react";
import type { Reviews } from "../hooks/useReviews";

export function ReviewsView({ reviews }: { reviews: Reviews }) {
  return (
    <Sheet title="Revisões" className="mx-auto max-w-3xl">
      <div className="mb-3 flex gap-1.5" role="group" aria-label="Quais revisões">
        <Chip pressed={reviews.tab === "due"} onClick={() => reviews.setTab("due")}>
          Vencidas · {reviews.dueCount}
        </Chip>
        <Chip pressed={reviews.tab === "upcoming"} onClick={() => reviews.setTab("upcoming")}>
          Próximas · {reviews.upcomingCount}
        </Chip>
      </div>
      {reviews.rows.length ? (
        <div className="stagger">
          {reviews.rows.map((row) => (
            <ListRow
              key={row.id}
              aside={
                reviews.tab === "due" ? (
                  <Button variant="gold" onClick={() => reviews.review(row.topicId)}>
                    Revisar
                  </Button>
                ) : (
                  <span className="text-xs text-ink-muted">{row.when}</span>
                )
              }
            >
              <span className="flex items-center gap-2.5 py-1">
                <Crest name={row.subject} index={row.subjectIndex} size={26} showInitials={false} />
                <span className="min-w-0">
                  <span className="block">{row.topic}</span>
                  <span className="text-xs text-ink-muted">
                    {row.subject} · {row.stage}ª revisão
                    {reviews.tab === "due" && (
                      <b className={row.late ? "text-rose-strong" : ""}> · {row.when}</b>
                    )}
                  </span>
                  {row.onTimeToday && <Tag className="ml-2" icon="coin">+{reviews.onTimeXp} XP em dia</Tag>}
                </span>
              </span>
            </ListRow>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Mascot pose="dormindo" className="w-28" />
          <p className="text-ink-muted">
            {reviews.tab === "due"
              ? "Nenhuma revisão vencida. Pergaminhos em dia."
              : reviews.hasExam
                ? "As revisões aparecem depois do primeiro estudo de cada assunto."
                : "Monte seu concurso para começar."}
          </p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-dashed border-rule pt-3">
        <span className="text-sm text-ink-muted">
          Intervalos depois do primeiro estudo: {reviews.offsets.map((d) => `${d} ${d === 1 ? "dia" : "dias"}`).join(", ")}
        </span>
        <Button variant="quiet" onClick={() => reviews.setEditing(true)}>
          Mudar
        </Button>
      </div>
      <OffsetsSheet reviews={reviews} />
    </Sheet>
  );
}

function OffsetsSheet({ reviews }: { reviews: Reviews }) {
  const [values, setValues] = useState<string[]>([]);
  const current = values.length ? values : reviews.offsets.map(String);
  return (
    <BottomSheet
      open={reviews.editing}
      onOpenChange={(open) => {
        reviews.setEditing(open);
        if (!open) setValues([]);
      }}
      title="Intervalos"
      description="Dias depois do primeiro estudo de um assunto. Valem para os próximos assuntos estudados."
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {current.map((value, i) => (
            <Field
              key={i}
              label={`${i + 1}ª revisão`}
              type="number"
              min={1}
              max={365}
              value={value}
              onChange={(e) => setValues(current.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
        </div>
        <Button onClick={() => reviews.saveOffsets(current.map(Number))}>Salvar</Button>
      </div>
    </BottomSheet>
  );
}
