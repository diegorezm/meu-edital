import type { CollectionOptions } from "@meu-edital/sync/client";
import type { StorageAdapter } from "@tanstack/offline-transactions";

/** Onde o sync guarda os dados e a fila de um usuário no aparelho. */
export type SyncStorage = {
  /** Envolve cada coleção com a persistência local; ausente, os dados ficam só em memória. */
  persist?: (options: CollectionOptions) => CollectionOptions;
  /** Fila de alterações ainda não enviadas. */
  storage?: StorageAdapter;
  close(): Promise<void>;
};

/**
 * Recursos que mudam entre a web e o app nativo (Capacitor). Telas usam só
 * esta interface e nunca verificam a plataforma.
 */
export type Platform = {
  /** Roda dentro do app nativo. */
  native: boolean;
  /**
   * Banco local de um usuário: linhas sincronizadas e fila de alterações.
   * SQLite nas duas plataformas (OPFS na web; nativo no app, porque o
   * sistema pode limpar o armazenamento do WebView).
   */
  syncStorage(userId: string): Promise<SyncStorage>;
  /** Apaga o banco local (ao excluir a conta). */
  clearSyncStorage(userId: string): Promise<void>;
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
