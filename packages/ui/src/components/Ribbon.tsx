import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "teal" | "gold" | "maroon";

const tones: Record<Tone, string> = {
  teal: "bg-teal-strong text-paper-raised",
  gold: "bg-gold text-ink",
  maroon: "bg-maroon text-paper-raised",
};

/**
 * Faixa: título pendurado no topo de uma folha, com as pontas em V.
 * Verde-azulado no painel principal, ouro nos secundários, vinho no nome.
 */
export function Ribbon({ tone = "teal", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="ink-outline inline-block">
      <span
        className={clsx(
          "font-title inline-block px-8 pt-px pb-1 text-display-md leading-tight",
          "[clip-path:polygon(0_0,100%_0,calc(100%-13px)_50%,100%_100%,0_100%,13px_50%)]",
          tones[tone],
        )}
      >
        {children}
      </span>
    </span>
  );
}
