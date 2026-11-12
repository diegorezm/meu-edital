import clsx from "clsx";
import type { ReactNode } from "react";
import { Ribbon } from "./Ribbon";

/** Folha de pergaminho: a superfície de todo conteúdo. Folhas não se aninham. */
export function Sheet({
  title,
  tone,
  ribbonSize = "md",
  className,
  children,
}: {
  title?: string;
  tone?: "teal" | "gold" | "maroon";
  ribbonSize?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={clsx(
        "relative min-w-0 rounded border-2 border-ink bg-paper px-4 pb-4",
        "shadow-[var(--shadow-inset-rule),var(--shadow-sheet)]",
        title ? "pt-9" : "pt-4",
        className,
      )}
    >
      {title && (
        <h2 className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <Ribbon tone={tone} size={ribbonSize}>
            {title}
          </Ribbon>
        </h2>
      )}
      {children}
    </section>
  );
}
