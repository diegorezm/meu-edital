import clsx from "clsx";
import type { ReactNode } from "react";
import { Badge } from "./Badge";
import { Icon, type IconName } from "./Icon";

/**
 * Item da navegação lateral (desktop). O ativo é uma placa em vinho com
 * texto claro. Use as classes no `Link` do roteador e o conteúdo dentro.
 */
export const navItemClass = (active: boolean) =>
  clsx(
    "flex min-h-9 items-center gap-2.5 rounded-[5px] border-2 px-2.5 py-1 text-[15px] font-bold no-underline",
    active
      ? "border-ink bg-maroon text-paper-raised shadow-press"
      : "border-transparent text-ink hover:border-rule hover:bg-paper-raised",
  );

export function NavItemContent({
  icon,
  label,
  badge,
  active,
}: {
  icon: IconName;
  label: string;
  badge?: ReactNode;
  active: boolean;
}) {
  return (
    <>
      <Icon name={icon} />
      {label}
      {badge !== undefined && badge !== null && <Badge active={active}>{badge}</Badge>}
    </>
  );
}

/** Placa da barra inferior (celular). Estudar fica em destaque no centro. */
export const tabItemClass = (active: boolean, highlight = false) =>
  clsx(
    "grid min-h-11 justify-items-center gap-px rounded-[5px] border-2 py-1 text-[11px] font-extrabold no-underline",
    highlight
      ? "-mt-3 border-ink bg-teal-strong text-paper-raised shadow-press"
      : active
        ? "border-ink bg-maroon text-paper-raised"
        : "border-transparent text-ink",
  );

export function TabItemContent({ icon, label }: { icon: IconName; label: string }) {
  return (
    <>
      <Icon name={icon} className="size-5" />
      {label}
    </>
  );
}
