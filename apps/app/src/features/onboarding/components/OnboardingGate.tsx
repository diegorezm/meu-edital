import { useState } from "react";
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
  // Ajuste durante a renderização: excluir o último concurso reabre o onboarding.
  if (needed && !active) setActive(true);
  if (active) return <OnboardingScreen onDone={() => setActive(false)} />;
  return children;
}
