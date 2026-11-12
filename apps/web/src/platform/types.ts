import type { LocalStore } from "@meu-edital/sync";

/**
 * Recursos que mudam entre a web e o app nativo (Capacitor, fase de mobile).
 * Telas usam só esta interface e nunca verificam a plataforma.
 */
export type Platform = {
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
   * localStorage na web; Preferences do Capacitor no app.
   */
  preferences: {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
  };
  /** Guarda segredos (token de sessão no app). Na web, a sessão é cookie. */
  secureStorage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };
  notifications: {
    requestPermission(): Promise<boolean>;
    /** Aviso imediato (ex.: fim de bloco com a aba aberta). */
    show(title: string, body: string): Promise<void>;
  };
  vibrate(pattern: number | number[]): void;
};
