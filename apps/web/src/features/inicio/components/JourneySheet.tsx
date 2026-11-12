import { BlockCard, BottomSheet, Button, Sheet } from "@meu-edital/ui";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { HomeView, JourneyCard } from "../hooks/useHome";

/**
 * Jornada: os blocos do ciclo como cartas. No desktop, em grade; no
 * celular, em fileira horizontal centrada na carta atual, que é maior.
 */
export function JourneySheet({
  view,
  mobile,
  onStart,
  onSkip,
}: {
  view: HomeView;
  mobile: boolean;
  onStart: (cycleItemId: string) => void;
  onSkip: (cycleItemId: string) => void;
}) {
  const [skipping, setSkipping] = useState<JourneyCard | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const current = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mobile) current.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [mobile, view.position]);

  const card = (item: JourneyCard) => (
    <BlockCard
      state={item.state}
      numeral={item.numeral}
      subject={item.subject}
      subjectIndex={item.subjectIndex}
      topic={item.topic}
      minutes={item.state === "boss" ? undefined : item.minutes}
      xp={item.state === "boss" ? undefined : item.xp}
      onSelect={item.state === "next" ? () => setSkipping(item) : undefined}
      action={
        item.state === "now" && item.cycleItemId ? (
          <Button onClick={() => onStart(item.cycleItemId!)}>Partir</Button>
        ) : undefined
      }
      className={clsx(mobile && "w-[104px] flex-none", mobile && item.state === "now" && "w-[132px] min-h-[172px]")}
    />
  );

  return (
    <Sheet title={`Jornada · volta ${view.lap}`} ribbonSize="lg" className="px-[18px] pt-[30px] pb-[18px]">
      <p className="mb-5 text-center text-sm text-ink-muted">
        Bloco {view.position} de {view.blocks} · faltou um dia? a jornada espera por você.
      </p>
      {mobile ? (
        <div ref={strip} className="-mx-[18px] flex snap-x items-start gap-2.5 overflow-x-auto px-[18px] pt-3 pb-2">
          {view.cards.map((item) => (
            <div key={item.key} ref={item.state === "now" ? current : undefined} className={clsx("snap-center", item.state !== "now" && "mt-4")}>
              {card(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-3 gap-y-[22px] pt-1">
          {view.cards.map((item) => (
            <div key={item.key} className="grid">
              {card(item)}
            </div>
          ))}
        </div>
      )}
      <BottomSheet
        open={Boolean(skipping)}
        onOpenChange={(open) => !open && setSkipping(null)}
        title="Pular para cá?"
        description="O cadeado só quer dizer que ainda não chegou a vez. Você pode pular os blocos do meio e seguir daqui."
      >
        {skipping && (
          <div className="flex gap-2">
            <Button variant="quiet" className="flex-1" onClick={() => setSkipping(null)}>
              Ficar
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onSkip(skipping.cycleItemId!);
                setSkipping(null);
              }}
            >
              Pular
            </Button>
          </div>
        )}
      </BottomSheet>
    </Sheet>
  );
}
