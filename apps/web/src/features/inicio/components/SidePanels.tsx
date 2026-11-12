import { Button, ContractRow, ListRow, Sheet, SheetHead, SubjectAttribute } from "@meu-edital/ui";
import clsx from "clsx";
import type { HomeView } from "../hooks/useHome";

export function SubjectsSheet({ view }: { view: HomeView }) {
  return (
    <Sheet title="Matérias" tone="gold" ribbonSize="sm" className="pt-[26px]">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2.5">
        {view.subjects.map((subject) => (
          <SubjectAttribute
            key={subject.id}
            name={subject.name}
            index={subject.index}
            stars={subject.stars}
            caption={subject.caption}
          />
        ))}
      </div>
    </Sheet>
  );
}

export function ContractsSheet({ view }: { view: HomeView }) {
  return (
    <Sheet title="Contratos do dia" tone="gold" ribbonSize="sm" className="pt-[26px]">
      {view.contracts.map((contract) => (
        <ContractRow
          key={contract.id}
          title={contract.title}
          done={contract.done}
          progress={contract.target > 1 ? `${contract.progress}/${contract.target}` : undefined}
          rewardXp={contract.rewardXp}
        />
      ))}
      <p className="mt-1 text-xs text-ink-muted">Cumpridos pelo estudo que você registra.</p>
    </Sheet>
  );
}

export function ReviewsSheet({ view, onReview }: { view: HomeView; onReview: () => void }) {
  return (
    <Sheet>
      <SheetHead
        title="Revisões vencidas"
        hint={view.dueCount === 1 ? "1 pergaminho" : `${view.dueCount} pergaminhos`}
      />
      {view.reviews.length ? (
        <>
          {view.reviews.map((review) => (
            <ListRow
              key={review.id}
              aside={<i className="text-xs font-extrabold text-rose-strong not-italic">{review.when}</i>}
            >
              {review.topic}
            </ListRow>
          ))}
          <div className="mt-2.5 text-right">
            <Button variant="gold" onClick={onReview}>
              Revisar
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-muted">Nenhuma revisão vencida. Pergaminhos em dia.</p>
      )}
    </Sheet>
  );
}

const DOW = ["S", "T", "Q", "Q", "S", "S", "D"];

export function WeekSheet({ view }: { view: HomeView }) {
  const { week } = view;
  return (
    <Sheet>
      <SheetHead title="Semana" hint={`meta de ${week.target}`} />
      <b className="font-title text-[32px] leading-none">{week.studied}</b>{" "}
      <small className="text-sm text-ink-muted">· {week.percent}% da meta</small>
      <div
        className="mt-2 grid h-[62px] grid-cols-7 items-end gap-1.5 border-b-2 border-ink"
        role="img"
        aria-label={`Minutos por dia: ${week.days.map((d) => d.minutes).join(", ")}`}
      >
        {week.days.map((day) => (
          <i
            key={day.date}
            className={clsx(
              "block rounded-t-sm",
              day.minutes
                ? "border-2 border-b-0 border-ink"
                : "",
              day.minutes && (day.today ? "bg-[repeating-linear-gradient(45deg,var(--color-paper-raised)_0_4px,var(--color-gold)_4px_8px)]" : "bg-teal"),
            )}
            style={{ height: `${day.height}%` }}
          />
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-1.5 text-center text-xs text-ink-muted">
        {DOW.map((d, i) => (
          <span key={i} className={clsx(week.days[i]?.today && "font-extrabold text-ink")}>
            {d}
          </span>
        ))}
      </div>
    </Sheet>
  );
}

export function GuildSheet() {
  return (
    <Sheet>
      <SheetHead title="Guilda" hint="em breve" />
      <p className="text-sm text-ink-muted">
        Estude junto com amigos, numa liga semanal que mede constância, não horas. Chega em breve.
      </p>
    </Sheet>
  );
}
