import clsx from "clsx";
import type { ReactNode } from "react";

/** Linha de lista com divisória tracejada e o valor à direita. */
export function ListRow({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={clsx("grid grid-cols-[1fr_auto] items-center gap-1.5 border-b-[1.5px] border-dashed border-rule py-1 text-[13.5px] last:border-b-0", className)}>
      <span className="min-w-0">{children}</span>
      {aside}
    </div>
  );
}
