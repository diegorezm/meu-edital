import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from "@capacitor-community/sqlite";
import { type PluginListenerHandle, registerPlugin } from "@capacitor/core";
import { Haptics } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { type LocalStore, memoryStore, type Snapshot } from "@meu-edital/sync";
import type { Platform } from "./types";

/** Plugin próprio do Android: serviço em primeiro plano com o tempo correndo. */
type StudyTimerPlugin = {
  showRunning(options: { since: number; accumulatedMs: number; subject: string }): Promise<void>;
  showPaused(options: { accumulatedMs: number; subject: string }): Promise<void>;
  clear(): Promise<void>;
  addListener(event: "pause", listener: () => void): Promise<PluginListenerHandle>;
};
const StudyTimer = registerPlugin<StudyTimerPlugin>("StudyTimer");

const BLOCK_END_ID = 1;
/** Ids 1000 a 1013: um lembrete de revisão por dia, nos próximos 14 dias. */
const REVIEW_IDS = Array.from({ length: 14 }, (_, i) => 1000 + i);
const AVISOS = "avisos";

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

// Uma conexão SQLite para o app inteiro, aberta na primeira vez.
let opening: Promise<SQLiteDBConnection> | undefined;
function database() {
  return (opening ??= (async () => {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db = await sqlite.createConnection("meu-edital", false, "no-encryption", 1, false);
    await db.open();
    await db.execute("create table if not exists snapshots (name text primary key, value text not null)");
    return db;
  })());
}

/**
 * Banco local no SQLite: o sistema pode limpar o armazenamento do WebView, e
 * a fila guarda estudo ainda não enviado. Se o SQLite falhar, cai para memória.
 */
function sqliteStore(name: string): LocalStore {
  const fallback = memoryStore();
  let broken = false;
  return {
    async load() {
      if (broken) return fallback.load();
      try {
        const db = await database();
        const result = await db.query("select value from snapshots where name = ?", [name]);
        const raw = result.values?.[0]?.value as string | undefined;
        return raw ? (JSON.parse(raw) as Snapshot) : null;
      } catch {
        broken = true;
        return fallback.load();
      }
    },
    async save(snapshot) {
      if (broken) return fallback.save(snapshot);
      try {
        const db = await database();
        await db.run(
          "insert into snapshots (name, value) values (?, ?) on conflict(name) do update set value = excluded.value",
          [name, JSON.stringify(snapshot)],
        );
      } catch {
        broken = true;
        await fallback.save(snapshot);
      }
    },
  };
}

const granted = async () => (await LocalNotifications.checkPermissions()).display === "granted";

export const nativePlatform: Platform = {
  native: true,
  localStore: sqliteStore,
  async clearLocalStore(name) {
    const db = await database();
    await db.run("delete from snapshots where name = ?", [name]);
  },
  preferences: {
    get: (key) => storage()?.getItem(key) ?? null,
    set: (key, value) => storage()?.setItem(key, value),
    remove: (key) => storage()?.removeItem(key),
  },
  secureStorage: {
    async get(key) {
      const value = await SecureStorage.get(key);
      return typeof value === "string" ? value : null;
    },
    async set(key, value) {
      await SecureStorage.set(key, value);
    },
    async remove(key) {
      await SecureStorage.remove(key);
    },
  },
  notifications: {
    async requestPermission() {
      return (await LocalNotifications.requestPermissions()).display === "granted";
    },
    async show(title, body) {
      if (!(await granted())) return;
      await LocalNotifications.schedule({ notifications: [{ id: Date.now() % 100_000 + 100, title, body }] });
    },
  },
  // Notificação local agendada: funciona com o app fechado, sem servidor.
  blockEnd: {
    async schedule(endsAt, subject) {
      if (!(await granted())) return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: BLOCK_END_ID,
            title: "Bloco concluído",
            body: `O tempo de ${subject} acabou. Registre o estudo quando quiser.`,
            schedule: { at: new Date(endsAt), allowWhileIdle: true },
            extra: { url: "/estudar" },
          },
        ],
      });
    },
    async cancel() {
      await LocalNotifications.cancel({ notifications: [{ id: BLOCK_END_ID }] });
    },
  },
  studyTimer: {
    showRunning: (since, accumulatedMs, subject) => StudyTimer.showRunning({ since, accumulatedMs, subject }),
    showPaused: (accumulatedMs, subject) => StudyTimer.showPaused({ accumulatedMs, subject }),
    clear: () => StudyTimer.clear(),
    onPause(listener) {
      const handle = StudyTimer.addListener("pause", listener);
      return () => void handle.then((h) => h.remove());
    },
  },
  reviewReminders: {
    async set(days) {
      await LocalNotifications.cancel({ notifications: REVIEW_IDS.map((id) => ({ id })) });
      if (storage()?.getItem(AVISOS) !== "1" || !(await granted())) return;
      const notifications = days.slice(0, REVIEW_IDS.length).flatMap((day, i) => {
        const at = new Date(`${day.date}T08:00:00`);
        if (at.getTime() <= Date.now()) return [];
        return [
          {
            id: REVIEW_IDS[i],
            title: day.count === 1 ? "1 revisão para hoje" : `${day.count} revisões para hoje`,
            body: "Uma revisão rápida segura o que você já estudou.",
            schedule: { at, allowWhileIdle: true },
            extra: { url: "/revisoes" },
          },
        ];
      });
      if (notifications.length) await LocalNotifications.schedule({ notifications });
    },
  },
  vibrate(pattern) {
    const duration = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern;
    void Haptics.vibrate({ duration: Math.min(duration, 1000) });
  },
  // No app, os avisos são notificações locais: ligar é só dar permissão.
  push: {
    supported: () => true,
    async current() {
      return storage()?.getItem(AVISOS) === "1" && (await granted()) ? "local" : null;
    },
    async subscribe() {
      const ok = (await LocalNotifications.requestPermissions()).display === "granted";
      if (ok) storage()?.setItem(AVISOS, "1");
      return null;
    },
    async unsubscribe() {
      storage()?.removeItem(AVISOS);
      return null;
    },
  },
};
