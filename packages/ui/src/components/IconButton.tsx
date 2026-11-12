import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

/** Botão só de ícone, com rótulo para leitor de tela e área de toque de 44 px. */
export function IconButton({
  icon,
  label,
  tone = "ink",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; tone?: "ink" | "danger" }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        "grid size-11 flex-none cursor-pointer place-items-center rounded-[5px] hover:bg-paper-raised disabled:cursor-not-allowed disabled:opacity-40",
        tone === "danger" ? "text-rose-strong" : "text-ink",
        className,
      )}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
