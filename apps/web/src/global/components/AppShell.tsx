import { BottomSheet, Sheet } from "@meu-edital/ui";
import { type ReactNode, useState } from "react";
import { useLayout } from "../hooks/useLayout";
import { usePlayer } from "../hooks/usePlayer";
import { DesktopBeam, MobileBeam } from "./Beam";
import { SideNav, TabBar } from "./Navigation";
import { PlayerCard } from "./PlayerCard";

/** Parede rosa com as tábuas verticais, atrás das folhas. */
const wall =
  "min-h-dvh bg-wall bg-[repeating-linear-gradient(90deg,transparent_0_126px,rgb(91_59_51/.09)_126px_128px)]";

/**
 * Moldura do app logado. No desktop: viga com recursos e, à esquerda, a
 * ficha do jogador e a navegação em lista. No celular: viga com três
 * recursos e o retrato, barra inferior com cinco placas e "Mais".
 */
export function AppShell({ children }: { children: ReactNode }) {
  const view = usePlayer();
  const { mobile } = useLayout();
  const [profile, setProfile] = useState(false);

  if (mobile)
    return (
      <div className={wall}>
        <MobileBeam view={view} onOpenProfile={() => setProfile(true)} />
        <main className="px-2.5 pt-7 pb-28">{children}</main>
        <TabBar dueReviews={view.dueReviews} />
        <BottomSheet open={profile} onOpenChange={setProfile} title="Sua ficha">
          <PlayerCard view={view} />
        </BottomSheet>
      </div>
    );

  return (
    <div className={wall}>
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
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
