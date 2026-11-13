import { Art, type ArtKey, Sheet } from "@meu-edital/ui";
import type { ReactNode } from "react";

/**
 * Moldura das telas de conta: viga de madeira no topo e uma folha central.
 * No desktop, o mascote acompanha a folha ao lado.
 */
export function AuthLayout({
  title,
  mascot = "mascote.rosa.parado",
  children,
}: {
  title: string;
  mascot?: ArtKey;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b-2 border-wood-dark bg-wood px-4 py-2">
        <span className="font-title text-display-md text-paper-raised">Meu Edital</span>
      </header>
      <main className="grid flex-1 place-items-center px-4 py-10">
        <div className="grid w-full max-w-sm items-center gap-10 md:max-w-3xl md:grid-cols-[1fr_minmax(0,24rem)]">
          <div className="hidden justify-center md:flex">
            <Art name={mascot} className="w-56" />
          </div>
          <Sheet title={title}>{children}</Sheet>
        </div>
      </main>
    </div>
  );
}
