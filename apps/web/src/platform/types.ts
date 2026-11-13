import type { LocalStore } from "@meu-edital/sync";

/**
 * Recursos que mudam entre a web e o app nativo (Capacitor). Telas usam só
 * esta interface e nunca verificam a plataforma.
 */
export type Platform = {
  /** Roda dentro do app nativo. */
  native: boolean;
  /**
   * Banco local de um usuário: dados, fila de mutações e cursor do sync.
   * IndexedDB na web; SQLite no app, porque o sistema pode limpar o
   * armazenamento do WebView e a fila guarda estudo ainda não enviado.
   */
  localStore(name: string): LocalStore;
  /** Apaga o banco local (ao excluir a conta). */
  clearLocalStore(name: string): Promise<void>;
  /**
   * Preferências pequenas e síncronas do aparelho (estado do cronômetro).
   * localStorage nas duas plataformas.
   */
  preferences: {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
  };
  /** Segredos (token de sessão no app). Keystore/Keychain no app; na web a sessão é cookie. */
  secureStorage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };
  notifications: {
    requestPermission(): Promise<boolean>;
    /** Aviso imediato (ex.: fim de bloco com o app aberto). */
    show(title: string, body: string): Promise<void>;
  };
  /** Aviso de fim de bloco com o app fechado: Web Push na web, notificação local no app. */
  blockEnd: {
    schedule(endsAt: number, subject: string): Promise<void>;
    cancel(): Promise<void>;
  };
  /** Notificação do cronômetro com o tempo correndo (serviço em primeiro plano no Android). */
  studyTimer: {
    showRunning(runningSince: number, accumulatedMs: number, subject: string): Promise<void>;
    showPaused(accumulatedMs: number, subject: string): Promise<void>;
    clear(): Promise<void>;
    /** O estudante tocou em "Pausar" na notificação. */
    onPause(listener: () => void): () => void;
  };
  /**
   * Lembretes de revisões vencidas nos próximos dias (8h). Na web quem manda
   * é o servidor (cron + Web Push), então lá não faz nada.
   */
  reviewReminders: {
    set(days: { date: string; count: number }[]): Promise<void>;
  };
  vibrate(pattern: number | number[]): void;
  /** Avisos com o app fechado (assinatura de Web Push na web; permissão de notificação no app). */
  push: {
    supported(): boolean;
    current(): Promise<string | null>;
    subscribe(vapidPublicKey: string): Promise<PushSubscriptionJSON | null>;
    unsubscribe(): Promise<string | null>;
  };
};
