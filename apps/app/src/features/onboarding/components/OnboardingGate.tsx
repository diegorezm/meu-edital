import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { useStore } from "@global/store/store";
import { OnboardingScreen } from "./OnboardingScreen";

/**
 * Sem concurso não há ciclo, então o app abre o onboarding no lugar de um
 * painel vazio. Ele continua aberto depois de criar o concurso para mostrar o
 * ciclo pronto, até a pessoa seguir para o primeiro bloco.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { data } = useStore();
  const needed = Boolean(data && data.exams.length === 0);
  const [active, setActive] = useState(needed);
  // Bloco para abrir no estudo assim que as abas estiverem montadas.
  const start = useRef<string | null>(null);
  // Ajuste durante a renderização: excluir o último concurso reabre o onboarding.
  if (needed && !active) setActive(true);
  useEffect(() => {
    if (active || !start.current) return;
    router.push({ pathname: "/estudar", params: { cycleId: start.current } });
    start.current = null;
  }, [active]);
  if (active)
    return (
      <OnboardingScreen
        onDone={(cycleId) => {
          start.current = cycleId || null;
          setActive(false);
        }}
      />
    );
  return children;
}
