import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "gold" | "quiet";

const variants: Record<Variant, string> = {
  primary: "bg-teal-strong text-paper-raised",
  gold: "bg-gold text-ink",
  quiet: "bg-paper-raised text-ink",
};

/** Classes do botão, para links que parecem botão (ex.: `Link` do roteador). */
export const buttonClass = (variant: Variant = "primary", className?: string) =>
  clsx(
    "font-title inline-grid min-h-11 cursor-pointer place-items-center rounded-[5px] border-2 border-ink px-4 pt-1 pb-1.5 text-display-sm leading-none",
    "shadow-press transition-[transform,box-shadow] duration-[80ms] active:translate-y-[3px] active:shadow-none",
    "disabled:cursor-not-allowed disabled:border-dashed disabled:bg-paper-sunken disabled:text-ink-muted disabled:shadow-none disabled:active:translate-y-0",
    variants[variant],
    className,
  );

/**
 * Botão: principal (um por tela), secundário em ouro e discreto. Texto curto,
 * verbo no infinitivo. Pressionar desce 3 px e tira a sombra.
 */
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      {...props}
    />
  );
}
