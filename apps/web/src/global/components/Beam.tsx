import { CountUp, DatePlate, Portrait, Resource } from "@meu-edital/ui";
import type { PlayerView } from "../hooks/usePlayer";
import { formatDuration, formatNumber, formatShortDate } from "../utils/format";

/** Logotipo: flâmula vinho pendurada na viga. */
function Logo() {
  return (
    <span className="ink-outline -mb-[22px] self-start">
      <span className="font-title block bg-maroon px-4 pt-1 pb-3.5 text-[26px] text-paper-raised [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-11px),0_100%)]">
        Meu Edital
      </span>
    </span>
  );
}

const weekText = (view: PlayerView) =>
  view.week ? `de ${formatDuration(view.week.targetMinutes)}` : "na semana";

/** Viga de madeira do desktop: até cinco recursos e a placa de data. */
export function DesktopBeam({ view }: { view: PlayerView }) {
  return (
    <header className="flex items-center gap-3 border-b-[3px] border-wood-dark bg-wood px-4 py-2 shadow-[0_4px_0_rgb(91_59_51/.25)]">
      <Logo />
      <span className="flex-1" />
      <nav aria-label="Recursos" className="flex flex-wrap items-center justify-center gap-3">
        <Resource icon="coin" value={<CountUp value={view.player.xp} format={formatNumber} />} unit="XP" />
        <Resource icon="flame" value={view.streak} unit={view.streak === 1 ? "semana na meta" : "semanas na meta"} />
        <Resource icon="glass" value={<CountUp value={view.week?.minutes ?? 0} format={formatDuration} />} unit={weekText(view)} />
        <Resource icon="quill" value={<CountUp value={view.questions} format={formatNumber} />} unit="questões" />
        <Resource icon="scroll" value={view.dueReviews} unit={view.dueReviews === 1 ? "revisão" : "revisões"} />
      </nav>
      <span className="flex-1" />
      <DatePlate
        date={formatShortDate(view.today)}
        detail={
          view.daysToExam === null
            ? undefined
            : view.daysToExam > 0
              ? `prova em ${view.daysToExam} ${view.daysToExam === 1 ? "dia" : "dias"}`
              : view.daysToExam === 0
                ? "a prova é hoje"
                : undefined
        }
      />
    </header>
  );
}

/** Viga do celular: três recursos e o retrato, que abre a ficha. */
export function MobileBeam({ view, onOpenProfile }: { view: PlayerView; onOpenProfile: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-1.5 border-b-[3px] border-wood-dark bg-wood px-2.5 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <Resource compact icon="coin" value={<CountUp value={view.player.xp} format={formatNumber} />} unit="XP" />
      <Resource compact icon="glass" value={<CountUp value={view.week?.minutes ?? 0} format={formatDuration} />} unit="semana" />
      <Resource compact icon="scroll" value={view.dueReviews} unit="rev." />
      <button
        type="button"
        onClick={onOpenProfile}
        className="ml-auto grid min-h-11 min-w-11 place-items-center"
        aria-label="Abrir sua ficha"
      >
        <Portrait size="sm" skin={view.player.skin} hat={view.player.hat} alt="" />
      </button>
    </header>
  );
}
