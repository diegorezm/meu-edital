import { Sheet } from "@meu-edital/ui";
import clsx from "clsx";
import { useLayout } from "../hooks/useLayout";
import { wall } from "./wall";

/** Bloco apagado no lugar de um texto ou peça que ainda vai chegar. */
function Bar({ className }: { className?: string }) {
  return <span aria-hidden className={clsx("block rounded bg-paper-sunken", className)} />;
}

/** Recurso da viga ainda sem valor. */
const BeamSlot = ({ className }: { className?: string }) => (
  <span aria-hidden className={clsx("block h-7 rounded-full bg-wood-dark/60", className)} />
);

function Content() {
  return (
    <Sheet className="pt-6">
      <Bar className="mb-5 h-5 w-1/3" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Bar key={i} className="h-36" />
        ))}
      </div>
    </Sheet>
  );
}

/**
 * Moldura do app enquanto a sessão e os dados carregam: a viga, a ficha e a
 * navegação no lugar de sempre, com blocos que pulsam devagar. Com movimento
 * reduzido, o tema zera a animação e os blocos ficam parados.
 */
export function AppSkeleton() {
  const { mobile } = useLayout();
  return (
    <div className={wall} role="status" aria-live="polite">
      <span className="sr-only">Abrindo seu edital...</span>
      <div className="animate-pulse">
        {mobile ? (
          <>
            <header className="flex items-center gap-1.5 border-b-[3px] border-wood-dark bg-wood px-2.5 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
              <BeamSlot className="w-16" />
              <BeamSlot className="w-16" />
              <BeamSlot className="w-14" />
              <span aria-hidden className="ml-auto block size-11 rounded-full bg-wood-dark/60" />
            </header>
            <main className="px-2.5 pt-7 pb-28">
              <Content />
            </main>
            <nav
              aria-hidden
              className="fixed inset-x-0 bottom-0 grid grid-cols-5 gap-1 border-t-[3px] border-ink bg-paper px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Bar key={i} className="h-11" />
              ))}
            </nav>
          </>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b-[3px] border-wood-dark bg-wood px-4 py-2 shadow-[0_4px_0_rgb(91_59_51/.25)]">
              <span className="ink-outline -mb-[22px] self-start">
                <span className="font-title block bg-maroon px-4 pt-1 pb-3.5 text-[26px] text-paper-raised [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-11px),0_100%)]">
                  Meu Edital
                </span>
              </span>
              <span className="flex-1" />
              {["w-16", "w-24", "w-20", "w-20", "w-18"].map((w, i) => (
                <BeamSlot key={i} className={w} />
              ))}
              <span className="flex-1" />
              <BeamSlot className="h-9 w-16 rounded" />
            </header>
            <div className="mx-auto grid max-w-[1400px] grid-cols-[232px_minmax(0,1fr)] items-start gap-[18px] px-4 pt-7 pb-6">
              <aside className="flex flex-col gap-[22px]">
                <Sheet className="flex flex-col items-center gap-3 pt-6">
                  <span aria-hidden className="block size-24 rounded-full bg-paper-sunken" />
                  <Bar className="h-4 w-24" />
                  <Bar className="h-3 w-full" />
                  <Bar className="h-12 w-full" />
                </Sheet>
                <Sheet className="flex flex-col gap-2 pt-3">
                  {Array.from({ length: 8 }, (_, i) => (
                    <Bar key={i} className="h-8" />
                  ))}
                </Sheet>
              </aside>
              <main className="min-w-0">
                <Content />
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
