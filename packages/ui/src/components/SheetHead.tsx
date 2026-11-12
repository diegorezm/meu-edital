import type { ReactNode } from "react";

/** Cabeçalho de folha secundária: título em fonte de título e dica à direita. */
export function SheetHead({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="font-title text-display-sm leading-none">{title}</h2>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}
