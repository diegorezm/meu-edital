import clsx from "clsx";
import { type Hat, Mascot, type Pose, type Skin } from "./Mascot";

/** Retrato do jogador em moldura de arco, fundo verde-azulado e filete de ouro. */
export function Portrait({
  skin,
  hat,
  pose,
  size = "md",
  alt = "Seu retrato",
}: {
  skin?: Skin;
  hat?: Hat;
  pose?: Pose;
  size?: "sm" | "md";
  alt?: string;
}) {
  return (
    <span
      className={clsx(
        "mx-auto grid place-items-end justify-center overflow-hidden border-2 border-ink bg-teal-strong shadow-[inset_0_0_0_3px_var(--color-gold),inset_0_0_0_5px_var(--color-ink)]",
        size === "md" ? "h-[124px] w-[116px] rounded-[58px_58px_6px_6px]" : "size-[34px] rounded-[17px_17px_4px_4px] shadow-[inset_0_0_0_2px_var(--color-gold)]",
      )}
    >
      <Mascot skin={skin} hat={hat} pose={pose} alt={alt} className={size === "md" ? "-mb-1 w-[96px]" : "-mb-0.5 w-7"} />
    </span>
  );
}
