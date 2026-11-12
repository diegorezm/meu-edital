import { Button, Mascot, Sheet } from "@meu-edital/ui";
import { useLayout } from "@global/hooks/useLayout";
import type { useHome } from "../hooks/useHome";
import { JourneySheet } from "./JourneySheet";
import { ContractsSheet, GuildSheet, ReviewsSheet, SubjectsSheet, WeekSheet } from "./SidePanels";

/**
 * Início. Desktop largo: jornada e matérias no centro, contratos, revisões,
 * semana e guilda à direita (como em docs/mockups/dashboard-rpg.html).
 * Desktop estreito: a coluna da direita desce em duas colunas. Celular:
 * jornada em fileira e as folhas empilhadas.
 */
export function HomeView({ home }: { home: ReturnType<typeof useHome> }) {
  const { mobile, wide } = useLayout();
  const { view } = home;

  if (!view)
    return (
      <Sheet title="Bem-vindo à guilda" ribbonSize="lg" className="mx-auto max-w-xl pt-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot pose="dormindo" className="w-40" />
          <p>Sua jornada começa com um edital. A montagem do seu concurso chega na próxima etapa.</p>
          <p className="text-sm text-ink-muted">
            Enquanto isso, dá para explorar com um concurso de exemplo e apagar depois.
          </p>
          <Button onClick={home.useExample}>Explorar exemplo</Button>
        </div>
      </Sheet>
    );

  const center = (
    <>
      <JourneySheet view={view} mobile={mobile} onStart={home.start} onSkip={home.skipTo} />
      <SubjectsSheet view={view} />
    </>
  );
  const side = (
    <>
      <ContractsSheet view={view} />
      <ReviewsSheet view={view} onReview={home.review} />
      <WeekSheet view={view} />
      <GuildSheet />
    </>
  );

  if (mobile)
    return (
      <div className="flex flex-col gap-[26px]">
        <JourneySheet view={view} mobile onStart={home.start} onSkip={home.skipTo} />
        <ContractsSheet view={view} />
        <ReviewsSheet view={view} onReview={home.review} />
        <WeekSheet view={view} />
        <SubjectsSheet view={view} />
        <GuildSheet />
      </div>
    );

  if (wide)
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_282px] items-start gap-[18px]">
        <div className="flex min-w-0 flex-col gap-[22px]">{center}</div>
        <div className="flex flex-col gap-[22px]">{side}</div>
      </div>
    );

  return (
    <div className="flex flex-col gap-[22px]">
      {center}
      <div className="grid grid-cols-2 items-start gap-[18px] gap-y-[26px]">{side}</div>
    </div>
  );
}
