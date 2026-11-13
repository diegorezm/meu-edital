import { publicConfig, sendJson } from "@global/api";
import { platform } from "@platform/index";
import { useEffect, useState } from "react";

/** Liga e desliga os avisos com o app fechado (fim de bloco e revisões vencidas). */
export function useNotifications() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [available, setAvailable] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([publicConfig(), platform.push.current()])
      .then(([config, endpoint]) => {
        if (!active) return;
        setAvailable(Boolean(config.vapidPublicKey) && platform.push.supported());
        setEnabled(Boolean(endpoint));
      })
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, []);

  const turnOn = async () => {
    setPending(true);
    setError("");
    try {
      const { vapidPublicKey } = await publicConfig();
      const subscription = vapidPublicKey ? await platform.push.subscribe(vapidPublicKey) : null;
      if (!subscription) {
        setError("O navegador não deu permissão para avisos. Dá para liberar nas configurações do site.");
        return;
      }
      await sendJson("/push/assinatura", "POST", subscription);
      setEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para ligar os avisos.");
    } finally {
      setPending(false);
    }
  };

  const turnOff = async () => {
    setPending(true);
    try {
      const endpoint = await platform.push.unsubscribe();
      if (endpoint) await sendJson("/push/assinatura", "DELETE", { endpoint });
      setEnabled(false);
    } finally {
      setPending(false);
    }
  };

  return { available, enabled, pending, error, turnOn, turnOff };
}
