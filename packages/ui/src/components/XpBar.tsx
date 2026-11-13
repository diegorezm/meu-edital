import clsx from "clsx";
import { useChanged } from "../hooks/motion";

/**
 * Barra de XP: trilho afundado, preenchimento em ouro e marcas a cada 10%.
 * Sempre acompanhada do valor em texto.
 */
export function XpBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const grew = useChanged(percent);
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
        className={clsx("relative block h-full overflow-hidden bg-gold transition-[width] duration-700 ease-(--ease-out-soft)", percent > 0 && percent < 100 && "border-r-2 border-ink")}
        style={{ width: `${percent}%` }}
      >
        {grew && (
          <span
            key={percent}
            className="absolute inset-y-0 left-0 w-1/2 animate-shine bg-[linear-gradient(90deg,transparent,rgb(255_255_255/.6),transparent)]"
          />
        )}
      </span>
    </div>
  );
}
