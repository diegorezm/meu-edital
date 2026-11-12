import type { Celebration } from "@meu-edital/domain";
import { BottomSheet, Button, Mascot, XpBar } from "@meu-edital/ui";
import { formatNumber } from "../utils/format";
import { celebrationStore, useCelebration } from "./celebrationStore";

const eventText = (event: Celebration): string => {
  switch (event.kind) {
    case "level":
      return event.rankChanged
        ? `Promoção! Agora você é ${event.rank}, nível ${event.level}.`
        : `Subiu para o nível ${event.level}!`;
    case "lap":
      return `Volta ${event.laps} completa. O chefe da volta te espera em Simulados.`;
    case "weekGoal":
      return "Meta da semana batida!";
    case "achievement":
      return `Conquista: ${event.title}`;
  }
};

/**
 * Comemoração curta depois de registrar estudo: mascote comemorando, XP
 * ganho, barra do nível e os marcos do momento. Pode ser fechada na hora.
 */
export function CelebrationOverlay() {
  const moment = useCelebration();
  const big = moment?.events.some((e) => e.kind !== "weekGoal");
  return (
    <BottomSheet
      open={Boolean(moment)}
      onOpenChange={(open) => !open && celebrationStore.dismiss()}
      title={big ? "Que marco!" : "Estudo registrado"}
    >
      {moment && (
        <div className="flex flex-col items-center gap-2 text-center">
          <Mascot pose="comemorando" className="w-32 motion-safe:animate-[pop_.6s_ease-out]" />
          <p className="font-title text-[44px] leading-none">+{formatNumber(moment.xpGained)} XP</p>
          <XpBar
            className="w-full max-w-xs"
            value={moment.level.progress}
            label={`Progresso do nível ${moment.level.level}`}
          />
          <p className="text-sm text-ink-muted">
            {moment.level.rank} · nível {moment.level.level} · faltam{" "}
            {formatNumber(moment.level.nextLevelAt - moment.level.xp)} XP
          </p>
          {moment.events.map((event) => (
            <p key={event.id} className="font-extrabold">
              {eventText(event)}
            </p>
          ))}
          {moment.contractsDone.map((title) => (
            <p key={title} className="font-bold">
              Contrato cumprido: {title.toLowerCase()}
            </p>
          ))}
          <Button className="mt-2 w-full" onClick={() => celebrationStore.dismiss()}>
            Seguir a jornada
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
