import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

/**
 * Chip de escolha: placa pequena que fica vinho quando selecionada. Em grupo,
 * funciona como seleção única (passe `pressed`).
 */
export function Chip({
  pressed,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={clsx(
        "min-h-10 cursor-pointer rounded-[5px] border-2 border-ink px-2.5 py-1 text-sm font-bold",
        pressed ? "bg-maroon text-paper-raised" : "bg-paper-raised text-ink hover:bg-card-now",
        className,
      )}
      {...props}
    />
  );
}
