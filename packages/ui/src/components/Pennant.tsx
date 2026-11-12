import clsx from "clsx";
import type { ReactNode } from "react";

/** Flâmula: etiqueta com a base em V, para o nome sob um retrato ou brasão. */
export function Pennant({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx("ink-outline inline-block", className)}>
      <span className="font-title inline-block bg-paper-raised px-2.5 pt-px pb-2.5 text-[17px] [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-7px),0_100%)]">
        {children}
      </span>
    </span>
  );
}
