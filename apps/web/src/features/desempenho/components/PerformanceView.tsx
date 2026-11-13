import { BottomSheet, Crest, Icon, ListRow, Mascot, Sheet, Tag } from "@meu-edital/ui";
import { useLayout } from "@global/hooks/useLayout";
import clsx from "clsx";
import { Fragment } from "react";
import type { Performance } from "../hooks/usePerformance";

type Subject = NonNullable<Performance["subjects"]>[number];

function WeakTag({ topicId, perf }: { topicId: string; perf: Performance }) {
  return (
    <button type="button" onClick={() => void perf.practice(topicId)} className="ml-1 cursor-pointer" title="Estudar questões deste assunto">
      <Tag>reforçar</Tag>
    </button>
  );
}

export function PerformanceView({ perf }: { perf: Performance }) {
  const { mobile } = useLayout();
  if (!perf.subjects)
    return (
      <Sheet title="Desempenho" className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <Mascot pose="dormindo" className="w-32" />
          <p>Monte seu concurso para ver o desempenho.</p>
        </div>
      </Sheet>
    );

  if (mobile) {
    const current = perf.subjects.find((s) => s.id === perf.open);
    return (
      <Sheet title="Desempenho">
        {perf.subjects.map((s) => (
          <ListRow key={s.id} aside={<Icon name="back" className="rotate-180" />}>
            <button type="button" onClick={() => perf.toggle(s.id)} className="flex min-h-11 w-full items-center gap-2 text-left">
              <Crest name={s.name} index={s.index} size={26} showInitials={false} />
              <span>
                <b className="font-extrabold">{s.name}</b>
                <span className="block text-xs text-ink-muted">
                  {s.time} · {s.questions} questões · {s.accuracy}
                </span>
              </span>
            </button>
          </ListRow>
        ))}
        <BottomSheet open={Boolean(current)} onOpenChange={(o) => !o && perf.close()} title={current?.name ?? "Matéria"}>
          {current?.topics.map((t) => (
            <ListRow key={t.id} aside={<span className="text-xs text-ink-muted">{t.last}</span>}>
              <span>
                {t.name}
                {t.weak && <WeakTag topicId={t.id} perf={perf} />}
                <span className="block text-xs text-ink-muted">
                  {t.time} · {t.questions} questões · {t.accuracy}
                </span>
              </span>
            </ListRow>
          ))}
        </BottomSheet>
      </Sheet>
    );
  }

  const row = (s: Subject) => (
    <Fragment key={s.id}>
      <tr className="border-b-[1.5px] border-dashed border-rule">
        <td className="py-1.5">
          <button type="button" onClick={() => perf.toggle(s.id)} className="flex min-h-9 items-center gap-2 font-extrabold" aria-expanded={perf.open === s.id}>
            <Icon name="caret" className={clsx("size-3.5 transition-transform", perf.open !== s.id && "-rotate-90")} />
            <Crest name={s.name} index={s.index} size={22} showInitials={false} />
            {s.name}
          </button>
        </td>
        <td>{s.time}</td>
        <td>{s.sessions}</td>
        <td>{s.questions}</td>
        <td>{s.accuracy}</td>
        <td className="text-ink-muted">{s.last}</td>
      </tr>
      {perf.open === s.id &&
        s.topics.map((t) => (
          <tr key={t.id} className="border-b-[1.5px] border-dashed border-rule bg-paper-raised">
            <td className="py-1.5 pl-12">{t.name}</td>
            <td>{t.time}</td>
            <td>{t.sessions}</td>
            <td>{t.questions}</td>
            <td>
              <span className={clsx(t.weak && "font-extrabold text-rose-strong")}>{t.accuracy}</span>
              {t.weak && <WeakTag topicId={t.id} perf={perf} />}
            </td>
            <td className="text-ink-muted">{t.last}</td>
          </tr>
        ))}
    </Fragment>
  );

  return (
    <Sheet title="Desempenho">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left text-xs text-ink-muted">
            <th className="py-1 font-bold">Matéria</th>
            <th className="py-1 font-bold">Tempo</th>
            <th className="py-1 font-bold">Sessões</th>
            <th className="py-1 font-bold">Questões</th>
            <th className="py-1 font-bold">Acertos</th>
            <th className="py-1 font-bold">Último estudo</th>
          </tr>
        </thead>
        <tbody>{perf.subjects.map(row)}</tbody>
      </table>
    </Sheet>
  );
}
