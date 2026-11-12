import clsx from "clsx";

/**
 * Barra de XP: trilho afundado, preenchimento em ouro e marcas a cada 10%.
 * Sempre acompanhada do valor em texto.
 */
export function XpBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={clsx(
        "relative h-3.5 overflow-hidden rounded-sm border-2 border-ink bg-paper-sunken",
        "after:absolute after:inset-0 after:bg-[repeating-linear-gradient(90deg,transparent_0_10%,rgb(91_59_51/.35)_10%_calc(10%+1px))]",
        className,
      )}
    >
      <span
        className={clsx("block h-full bg-gold transition-[width]", percent > 0 && percent < 100 && "border-r-2 border-ink")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
