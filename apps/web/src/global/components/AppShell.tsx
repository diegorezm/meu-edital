import { BottomSheet, Sheet } from "@meu-edital/ui";
import { ensureWeekTarget } from "@meu-edital/domain";
import { useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { CelebrationOverlay } from "../celebrations/CelebrationOverlay";
import { useLayout } from "../hooks/useLayout";
import { usePlayer } from "../hooks/usePlayer";
import { DesktopBeam, MobileBeam } from "./Beam";
import { SideNav, TabBar } from "./Navigation";
import { useActiveExamId } from "../store/queries";
import { useStoreActions } from "../store/useStore";
import { TimerTicker } from "../timer/TimerTicker";
import { ReviewReminders } from "./ReviewReminders";
import { PlayerCard } from "./PlayerCard";
import { SyncBanner } from "./SyncBanner";
import { wall } from "./wall";

/** Salva o retrato da meta da semana do concurso ativo assim que ela começa. */
function useWeekSnapshot() {
  const { update } = useStoreActions();
  const examId = useActiveExamId();
  useEffect(() => {
    if (examId) update((data) => ensureWeekTarget(data, examId));
  }, [examId, update]);
}

/** Peças sem desenho próprio que acompanham todo o app logado. */
function Companions() {
  return (
    <>
      <TimerTicker />
      <ReviewReminders />
      <CelebrationOverlay />
    </>
  );
}


/**
 * Moldura do app logado. No desktop: viga com recursos e, à esquerda, a
 * ficha do jogador e a navegação em lista. No celular: viga com três
 * recursos e o retrato, barra inferior com cinco placas e "Mais".
 */
export function AppShell({ userName, children }: { userName?: string | null; children: ReactNode }) {
  const view = usePlayer(userName);
  const { mobile } = useLayout();
  const [profile, setProfile] = useState(false);
  useWeekSnapshot();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const page = (
    <div key={path} className="animate-rise">
      <SyncBanner />
      {children}
    </div>
  );
  const skipLink = (
    <a
      href="#conteudo"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:border-2 focus:border-ink focus:bg-paper-raised focus:px-3 focus:py-2 focus:font-bold focus:text-ink"
    >
      Pular para o conteúdo
    </a>
  );

  if (mobile)
    return (
      <div className={wall}>
        {skipLink}
        <MobileBeam view={view} onOpenProfile={() => setProfile(true)} />
        <main id="conteudo" className="px-2.5 pt-7 pb-28">{page}</main>
        <TabBar dueReviews={view.dueReviews} />
        <Companions />
        <BottomSheet open={profile} onOpenChange={setProfile} title="Sua ficha">
          <PlayerCard view={view} />
        </BottomSheet>
      </div>
    );

  return (
    <div className={wall}>
      {skipLink}
      <DesktopBeam view={view} />
      <div className="mx-auto grid max-w-[1400px] grid-cols-[232px_minmax(0,1fr)] items-start gap-[18px] px-4 pt-7 pb-6">
        <aside className="sticky top-4 flex flex-col gap-[22px]">
          <Sheet className="pt-6">
            <PlayerCard view={view} />
          </Sheet>
          <Sheet className="pt-3">
            <SideNav dueReviews={view.dueReviews} />
          </Sheet>
        </aside>
        <main id="conteudo" className="min-w-0">{page}</main>
      </div>
      <Companions />
    </div>
  );
}
