import clsx from "clsx";
import type { ReactNode } from "react";
import { Crest } from "./Crest";
import { Icon } from "./Icon";
import { Stamp } from "./Stamp";
import { Tag } from "./Tag";

export type BlockState = "done" | "now" | "next" | "boss";

const surfaces: Record<BlockState, string> = {
  done: "bg-card-done shadow-[inset_0_0_0_3px_var(--color-card-done),inset_0_0_0_4px_var(--color-rule)]",
  now: "bg-card-now shadow-[inset_0_0_0_3px_var(--color-card-now),inset_0_0_0_5px_var(--color-gold),0_0_0_4px_rgb(227_176_75/.45)]",
  next: "bg-paper-sunken shadow-[inset_0_0_0_3px_var(--color-paper-sunken),inset_0_0_0_4px_var(--color-rule)]",
  boss: "bg-card-boss shadow-[inset_0_0_0_3px_var(--color-card-boss),inset_0_0_0_4px_var(--color-rule)]",
};
const tabs: Record<BlockState, string> = {
  done: "bg-paper-sunken",
  now: "bg-gold",
  next: "bg-paper-sunken",
  boss: "bg-maroon text-paper-raised",
};

/**
 * Carta de bloco: a unidade da jornada. Concluída tem carimbo; a atual tem
 * halo de ouro e o botão Partir; a próxima tem cadeado ("ainda não chegou a
 * vez", e tocar oferece pular para ela); o chefe tem caveira.
 */
export function BlockCard({
  state,
  numeral,
  subject,
  subjectIndex,
  topic,
  minutes,
  xp,
  action,
  onSelect,
  className,
}: {
  state: BlockState;
  numeral: string;
  subject: string;
  subjectIndex?: number;
  topic?: string;
  minutes?: number;
  xp?: number;
  /** Botão da carta atual (Partir). */
  action?: ReactNode;
  /** Tocar na carta (próxima: oferecer pular). */
  onSelect?: () => void;
  className?: string;
}) {
  const muted = state === "next";
  const body = (
    <>
      <span
        className={clsx(
          "font-title absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-[4px] border-2 border-ink px-2.5 pt-px pb-0.5 text-lg leading-none whitespace-nowrap",
          tabs[state],
        )}
      >
        {numeral}
      </span>
      {state === "boss" ? (
        <Icon name="skull" className="size-11 fill-paper-raised stroke-[1.6]" />
      ) : state === "next" ? (
        <span className="my-0.5 grid size-12 place-items-center rounded-full bg-[radial-gradient(var(--color-card-now)_30%,transparent_70%)]">
          <Icon name="lock" className="size-7 fill-gold stroke-[1.6]" />
        </span>
      ) : (
        <Crest name={subject} index={subjectIndex ?? 0} />
      )}
      <b className={clsx("mt-1 text-[14.5px] leading-tight font-extrabold", muted && "text-ink-muted")}>{subject}</b>
      {topic && <small className={clsx("text-xs leading-tight", "text-ink-muted")}>{topic}</small>}
      <span className="mt-auto flex items-center justify-center gap-1.5 pt-1.5">
        {state === "done" ? (
          <Stamp />
        ) : (
          <>
            {minutes !== undefined && (
              <Tag icon="glass">
                {minutes}
                {state === "now" && " min"}
              </Tag>
            )}
            {xp !== undefined && <Tag icon="coin">+{xp}</Tag>}
          </>
        )}
      </span>
      {action && <span className="mt-2">{action}</span>}
    </>
  );
  const classes = clsx(
    "relative flex min-h-[158px] flex-col items-center rounded-[6px] border-2 border-ink px-2 pt-[18px] pb-2.5 text-center",
    surfaces[state],
    state === "now" && "motion-safe:animate-[halo_2.4s_ease-in-out_infinite]",
    className,
  );
  if (onSelect && state !== "now")
    return (
      <button type="button" onClick={onSelect} className={clsx(classes, "cursor-pointer")}>
        {body}
      </button>
    );
  return <div className={classes}>{body}</div>;
}

const ROMAN: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

/** Numeral romano dos blocos da jornada (qualquer outro número é arábico). */
export function toRoman(value: number): string {
  let rest = Math.max(1, Math.floor(value));
  let out = "";
  for (const [n, symbol] of ROMAN)
    while (rest >= n) {
      out += symbol;
      rest -= n;
    }
  return out;
}
