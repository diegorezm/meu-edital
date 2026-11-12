import clsx from "clsx";
import type { ReactNode } from "react";

/** Contador em selo, à direita de um item de navegação. */
export function Badge({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <em
      className={clsx(
        "ml-auto rounded-sm border-[1.5px] px-1.5 text-[11px] font-extrabold not-italic",
        active ? "border-ink bg-gold text-ink" : "border-rule bg-paper-sunken text-ink-muted",
      )}
    >
      {children}
    </em>
  );
}
