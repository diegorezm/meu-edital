import { elapsedMs, formatClock, shouldNotifyEnd } from "@meu-edital/domain";
import { platform } from "@platform/index";
import { useEffect } from "react";
import { timerStore, useNow, useTimerState } from "./timerStore";

const TITLE = "Meu Edital";

/**
 * Mostra o tempo no título da aba e avisa quando o tempo planejado do bloco
 * acaba (Notification API, com a aba aberta). Não desenha nada.
 */
export function TimerTicker() {
  const timer = useTimerState();
  const now = useNow(Boolean(timer?.runningSince));

  useEffect(() => {
    if (!timer) {
      document.title = TITLE;
      return;
    }
    const clock = formatClock(elapsedMs(timer, now || Date.now()));
    document.title = timer.runningSince ? `${clock} · ${TITLE}` : `Pausado ${clock} · ${TITLE}`;
    if (shouldNotifyEnd(timer, now || Date.now())) {
      timerStore.set({ ...timer, notified: true });
      void platform.notifications.show(
        "Bloco concluído",
        "O tempo planejado acabou. Registre o estudo quando quiser.",
      );
      platform.vibrate([120, 60, 120]);
    }
  }, [timer, now]);

  useEffect(() => () => void (document.title = TITLE), []);
  return null;
}
