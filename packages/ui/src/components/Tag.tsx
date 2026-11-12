import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** Selo de recompensa: ícone e valor (tempo, XP). */
export function Tag({ icon, children, className }: { icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-[4px] border-[1.5px] border-ink bg-paper px-1.5 text-xs font-extrabold whitespace-nowrap",
        className,
      )}
    >
      {icon && (
        <Icon name={icon} className={clsx("size-3", icon === "coin" && "fill-gold")} />
      )}
      {children}
    </span>
  );
}
