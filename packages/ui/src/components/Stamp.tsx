import clsx from "clsx";
import type { ReactNode } from "react";

/** Carimbo: só para "Concluída". */
export function Stamp({ children = "Concluída", animate }: { children?: ReactNode; animate?: boolean }) {
  return (
    <span className={clsx(animate && "animate-stamp", "font-title inline-block -rotate-[5deg] rounded-[4px] border-2 border-green-strong px-2 pt-px pb-0.5 text-[17px] leading-none text-green-strong")}>
      {children}
    </span>
  );
}
