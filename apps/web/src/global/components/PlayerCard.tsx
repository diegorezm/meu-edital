import { BottomSheet, Icon, Portrait, Ribbon, XpBar } from "@meu-edital/ui";
import { useState } from "react";
import type { PlayerView } from "../hooks/usePlayer";
import { formatNumber } from "../utils/format";

/** Ficha do jogador: retrato, nome, patente e nível, barra de XP e o concurso ativo. */
export function PlayerCard({ view }: { view: PlayerView }) {
  const [picking, setPicking] = useState(false);
  const { player } = view;
  return (
    <div className="text-center">
      <Portrait skin={player.skin} hat={player.hat} />
      <div className="relative -mt-3">
        <Ribbon tone="maroon" size="sm">
          {view.name}
        </Ribbon>
      </div>
      <p className="mt-0.5 text-sm text-ink-muted">
        {player.rank} · nível {player.level}
      </p>
      <XpBar
        className="mt-2"
        value={player.progress}
        label={`Progresso para o nível ${player.level + 1}`}
      />
      <p className="mt-0.5 flex justify-between text-xs text-ink-muted">
        <span>
          {formatNumber(player.xp)} / {formatNumber(player.nextLevelAt)} XP
        </span>
        <span>nível {player.level + 1}</span>
      </p>
      {view.exam && (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="mt-2.5 flex min-h-11 w-full items-center gap-2 rounded-[5px] border-2 border-ink bg-paper-raised px-2 py-1 text-left text-sm leading-tight"
        >
          <Icon name="scroll" />
          <span className="min-w-0">
            <b className="block truncate text-[14px] font-extrabold">{view.exam.name}</b>
            <span className="text-ink-muted">
              {view.exam.role ? `${view.exam.role} · ` : ""}
              {view.examCoverage}% do edital
            </span>
          </span>
          <Icon name="caret" className="ml-auto size-3.5" />
        </button>
      )}
      <ExamPicker view={view} open={picking} onOpenChange={setPicking} />
    </div>
  );
}

/** Troca o concurso ativo. */
function ExamPicker({
  view,
  open,
  onOpenChange,
}: {
  view: PlayerView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Concursos" description="Escolha a campanha ativa.">
      <ul className="flex flex-col gap-2">
        {view.exams.map((exam) => {
          const active = exam.id === view.exam?.id;
          return (
            <li key={exam.id}>
              <button
                type="button"
                aria-current={active || undefined}
                onClick={() => {
                  view.selectExam(exam.id);
                  onOpenChange(false);
                }}
                className={
                  active
                    ? "flex min-h-11 w-full items-center gap-2 rounded-[5px] border-2 border-ink bg-maroon px-3 py-1.5 text-left font-bold text-paper-raised"
                    : "flex min-h-11 w-full items-center gap-2 rounded-[5px] border-2 border-ink bg-paper-raised px-3 py-1.5 text-left font-bold"
                }
              >
                {exam.name}
                {exam.role && <span className="font-medium opacity-80">· {exam.role}</span>}
                {active && <Icon name="check" className="ml-auto" />}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
