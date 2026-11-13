import { platform } from "../index";

/**
 * Rastreamento por categoria, só depois do consentimento.
 * - `erros`: relatórios de falha sem dados pessoais (legítimo interesse; a
 *   pessoa pode desligar).
 * - `analise`: estatísticas de uso (só com opt-in).
 * As telas chamam `tracking.track` e `tracking.identify` sem saber qual
 * ferramenta está por trás. Para plugar uma (Sentry, PostHog, GA), acrescente
 * um `TrackingProvider` em `PROVIDERS`.
 */
export type TrackingCategory = "erros" | "analise";
export type TrackingChoices = Record<TrackingCategory, boolean>;
export type SavedChoices = { choices: TrackingChoices; policyVersion: string; decidedAt: number };

export type TrackingProvider = {
  category: TrackingCategory;
  /** Carrega o SDK. Chamado uma vez, só com a categoria consentida. */
  load(): Promise<void>;
  /** Para de coletar quando o consentimento é retirado. */
  stop(): void;
  track?(event: string, properties?: Record<string, unknown>): void;
  identify?(userId: string | null): void;
};

const PROVIDERS: TrackingProvider[] = [];

export const DEFAULT_CHOICES: TrackingChoices = { erros: true, analise: false };
const KEY = "rastreamento";

function read(): SavedChoices | null {
  try {
    const raw = platform.preferences.get(KEY);
    return raw ? (JSON.parse(raw) as SavedChoices) : null;
  } catch {
    return null;
  }
}

let saved = read();
const loaded = new Set<TrackingProvider>();
const listeners = new Set<() => void>();

/** Ativa o que foi consentido e para o que não foi. */
function apply() {
  // Sem escolha, só o que é de legítimo interesse (erros) roda.
  const choices = saved?.choices ?? DEFAULT_CHOICES;
  for (const provider of PROVIDERS) {
    const allowed = choices[provider.category];
    if (allowed && !loaded.has(provider)) {
      loaded.add(provider);
      provider.load().catch(() => loaded.delete(provider));
    } else if (!allowed && loaded.has(provider)) {
      loaded.delete(provider);
      provider.stop();
    }
  }
}
apply();

export const tracking = {
  saved: () => saved,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  save(choices: TrackingChoices, policyVersion: string, decidedAt = Date.now()) {
    saved = { choices, policyVersion, decidedAt };
    try {
      platform.preferences.set(KEY, JSON.stringify(saved));
    } catch {
      // Sem armazenamento (aba privada): vale só nesta visita.
    }
    apply();
    listeners.forEach((l) => l());
  },
  track(event: string, properties?: Record<string, unknown>) {
    for (const p of loaded) p.track?.(event, properties);
  },
  identify(userId: string | null) {
    for (const p of loaded) p.identify?.(userId);
  },
};
