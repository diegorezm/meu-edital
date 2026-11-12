import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

const iconFill: Partial<Record<IconName, string>> = { coin: "fill-gold", flame: "fill-rose" };

/**
 * Recurso: placa na viga do topo com ícone, numeral e unidade. Informativo;
 * quando há destino, vira link (passe `as` com o link do roteador).
 */
export function Resource({
  icon,
  value,
  unit,
  compact,
  className,
}: {
  icon: IconName;
  value: ReactNode;
  unit: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1.5 rounded-[5px] border-2 border-ink bg-paper whitespace-nowrap text-ink",
        compact ? "px-1.5 pb-px text-[11px]" : "px-2.5 pb-0.5 pl-2 text-sm",
        className,
      )}
    >
      <Icon name={icon} className={clsx(compact ? "size-3.5" : "size-[17px]", iconFill[icon])} />
      <b className={clsx("font-title leading-[1.1]", compact ? "text-lg" : "text-[21px]")}>{value}</b>
      {unit}
    </span>
  );
}
