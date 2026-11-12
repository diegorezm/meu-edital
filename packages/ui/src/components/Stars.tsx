import clsx from "clsx";
import { Icon } from "./Icon";

/** Cinco estrelas de nível da matéria. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={clsx("flex justify-center gap-px", className)} role="img" aria-label={`${value} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name="star"
          className={clsx("size-3.5 stroke-[1.6]", i < value ? "fill-gold" : "fill-paper-raised")}
        />
      ))}
    </span>
  );
}
