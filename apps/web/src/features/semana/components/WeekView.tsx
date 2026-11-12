import { BottomSheet, Button, Crest, IconButton, ListRow, Mascot, Sheet, Tag, XpBar } from "@meu-edital/ui";
import { useLayout } from "@global/hooks/useLayout";
import clsx from "clsx";
import type { WeekScreen } from "../hooks/useWeek";
import { SessionForm } from "./SessionForm";

const DOW = ["S", "T", "Q", "Q", "S", "S", "D"];

export function WeekView({ week }: { week: WeekScreen }) {
  const { mobile } = useLayout();
  const { view } = week;
  if (!view)
    return (
      <Sheet title="Semana" className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <Mascot pose="dormindo" className="w-32" />
          <p>Monte seu concurso para acompanhar a semana.</p>
        </div>
      </Sheet>
    );

  const summary = (
    <Sheet title={view.label}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <IconButton icon="back" label="Semana anterior" onClick={week.previous} />
        <span className="text-center">
          <b className="font-title text-[40px] leading-none">{view.studied}</b>{" "}
          <span className="text-sm text-ink-muted">
            de {view.target} · {view.percent}%
          </span>
        </span>
        <IconButton icon="back" className="rotate-180" label="Semana seguinte" disabled={view.isCurrent} onClick={week.next} />
      </div>
      <div className="mt-2 grid h-[110px] grid-cols-7 items-end gap-2 border-b-2 border-ink" role="img" aria-label={`Minutos por dia: ${view.days.map((d) => d.minutes).join(", ")}`}>
        {view.days.map((day) => (
          <i
            key={day.date}
            className={clsx("block rounded-t-sm", day.minutes > 0 && "border-2 border-b-0 border-ink", day.minutes > 0 && (day.today ? "bg-gold" : "bg-teal"))}
            style={{ height: `${day.height}%` }}
          />
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-2 text-center text-xs text-ink-muted">
        {DOW.map((d, i) => (
          <span key={i} className={clsx(view.days[i]?.today && "font-extrabold text-ink")}>
            {d}
          </span>
        ))}
      </div>
    </Sheet>
  );

  const subjects = (
    <Sheet title="Matérias" tone="gold" ribbonSize="sm" className="pt-[26px]">
      {view.subjects.map((s) => (
        <ListRow key={s.id} aside={<span className="text-xs text-ink-muted">{s.studied} / {s.target}</span>}>
          <span className="flex items-center gap-2">
            <Crest name={s.name} index={s.index} size={24} showInitials={false} />
            <span className="min-w-0 flex-1">
              {s.name} {s.behind && <b className="text-xs text-rose-strong">atrasada</b>}
              <XpBar value={s.progress} label={`${s.name}: ${s.studied} de ${s.target}`} className="mt-0.5 h-3" />
            </span>
          </span>
        </ListRow>
      ))}
    </Sheet>
  );

  const sessions = (
    <Sheet title="Sessões" tone="gold" ribbonSize="sm" className="pt-[26px]">
      {view.sessions.length ? (
        view.sessions.map((s) => (
          <ListRow
            key={s.id}
            aside={
              <span className="flex items-center">
                <Tag icon="glass">{s.minutes} min</Tag>
                <IconButton icon="pencil" label="Corrigir sessão" onClick={() => week.edit(s.id)} />
                <IconButton icon="trash" tone="danger" label="Excluir sessão" onClick={() => week.askDelete(s.id)} />
              </span>
            }
          >
            <span className="flex gap-2">
              <span className="w-8 text-xs text-ink-muted">{s.weekday}</span>
              <span>
                <b className="font-extrabold">{s.subject}</b> · {s.topic}
                <span className="block text-xs text-ink-muted">
                  {s.type}
                  {s.questions ? ` · ${s.correct ?? 0}/${s.questions} acertos` : ""}
                </span>
              </span>
            </span>
          </ListRow>
        ))
      ) : (
        <p className="text-sm text-ink-muted">Nenhuma sessão nesta semana.</p>
      )}
    </Sheet>
  );

  return (
    <>
      {mobile ? (
        <div className="flex flex-col gap-[26px]">
          {summary}
          {sessions}
          {subjects}
        </div>
      ) : (
        <div className="grid items-start gap-[18px] lg:grid-cols-2">
          <div className="flex flex-col gap-[26px]">
            {summary}
            {subjects}
          </div>
          {sessions}
        </div>
      )}
      <BottomSheet open={Boolean(week.editing)} onOpenChange={(o) => !o && week.edit(null)} title="Corrigir sessão">
        {week.editing && <SessionForm key={week.editing.id} session={week.editing} onSave={week.save} />}
      </BottomSheet>
      <BottomSheet
        open={Boolean(week.deleting)}
        onOpenChange={(o) => !o && week.askDelete(null)}
        title="Excluir sessão?"
        description="O assunto, as revisões que ela agendou e a jornada voltam como estavam antes dela. O XP se corrige sozinho."
      >
        <div className="flex gap-2">
          <Button variant="quiet" className="flex-1" onClick={() => week.askDelete(null)}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={week.confirmDelete}>
            Excluir
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
