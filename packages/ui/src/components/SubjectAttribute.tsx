import clsx from "clsx";
import { Crest, subjectBackground } from "./Crest";
import { Stars } from "./Stars";

/** Atributo de matéria: retrato com brasão, placa com o nome, estrelas e uma linha de apoio. */
export function SubjectAttribute({
  name,
  index,
  stars,
  caption,
}: {
  name: string;
  index: number;
  stars: number;
  caption: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <div
        className={clsx(
          "grid h-[62px] place-items-center rounded-t-[5px] border-2 border-ink shadow-[inset_0_0_0_2px_rgb(255_255_255/.25)]",
          subjectBackground(index),
        )}
      >
        <Crest name={name} index={index} size={38} />
      </div>
      <span className="font-title block truncate border-2 border-t-0 border-ink bg-paper-raised px-1 pb-0.5 text-lg">
        {name}
      </span>
      <Stars value={stars} className="mt-1" />
      <small className="text-xs text-ink-muted">{caption}</small>
    </div>
  );
}
