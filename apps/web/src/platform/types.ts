/**
 * Recursos que mudam entre a web e o app nativo (Capacitor, fase de mobile).
 * Telas usam só esta interface e nunca verificam a plataforma.
 */
export type Platform = {
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
