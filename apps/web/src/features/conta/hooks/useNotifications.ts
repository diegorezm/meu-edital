import { publicConfig, publicConfigQuery, sendJson } from "@global/api";
import { platform } from "@platform/index";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/** Liga e desliga os avisos com o app fechado (fim de bloco e revisões vencidas). */
export function useNotifications() {
  const queryClient = useQueryClient();
  const { data: config } = useQuery(publicConfigQuery);
  const subscription = useQuery({
    queryKey: ["push", "assinatura"],
    queryFn: async () => Boolean(await platform.push.current()),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const available = !platform.push.serverManaged || (Boolean(config?.vapidPublicKey) && platform.push.supported());
  const enabled = subscription.isError ? false : (subscription.data ?? null);
  const setEnabled = (on: boolean) => queryClient.setQueryData(["push", "assinatura"], on);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const turnOn = async () => {
    setPending(true);
    setError("");
    try {
      if (!platform.push.serverManaged) {
        await platform.push.subscribe("");
        const on = Boolean(await platform.push.current());
        if (!on) setError("O aparelho não deu permissão para avisos. Dá para liberar nas configurações do app.");
        setEnabled(on);
        return;
      }
      const { vapidPublicKey } = await publicConfig();
      const sub = vapidPublicKey ? await platform.push.subscribe(vapidPublicKey) : null;
      if (!sub) {
        setError("O navegador não deu permissão para avisos. Dá para liberar nas configurações do site.");
        return;
      }
      await sendJson("/push/assinatura", "POST", sub);
      setEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para ligar os avisos.");
    } finally {
      setPending(false);
    }
  };

  const turnOff = async () => {
    setPending(true);
    setError("");
    try {
      const endpoint = await platform.push.unsubscribe();
      if (endpoint && platform.push.serverManaged) await sendJson("/push/assinatura", "DELETE", { endpoint });
      setEnabled(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para desligar os avisos.");
    } finally {
      setPending(false);
    }
  };

  return { available, enabled, pending, error, turnOn, turnOff };
}
