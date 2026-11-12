import clsx from "clsx";
import { Art, type ArtKey } from "../art";

export type Skin = "rosa" | "dourado" | "selvagem" | "melanoide";
export type Pose = "parado" | "estudando" | "comemorando" | "dormindo";
export type Hat = "capelo" | "mago" | "coroa";

/** Mascote com o chapéu da patente, as duas camadas no mesmo quadro. */
export function Mascot({
  skin = "rosa",
  pose = "parado",
  hat,
  className,
  alt = "",
}: {
  skin?: Skin;
  pose?: Pose;
  hat?: Hat;
  className?: string;
  alt?: string;
}) {
  return (
    <span className={clsx("relative inline-block aspect-[200/210]", className)} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <Art name={`mascote.${skin}.${pose}` as ArtKey} className="absolute inset-0 size-full" />
      {hat && <Art name={`chapeu.${hat}` as ArtKey} className="absolute inset-0 size-full" />}
    </span>
  );
}
