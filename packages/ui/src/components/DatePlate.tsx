/** Placa de data, a única forma arredondada. */
export function DatePlate({ date, detail }: { date: string; detail?: string }) {
  return (
    <span className="rounded-pill border-2 border-ink bg-paper-raised px-4 pb-0.5 text-sm whitespace-nowrap">
      <b className="font-title text-[21px]">{date}</b>
      {detail && ` · ${detail}`}
    </span>
  );
}
