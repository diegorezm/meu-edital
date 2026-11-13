import { browserSyncStorage, clearBrowserSyncStorage } from "./browserSync";
import type { Platform } from "./types";
import { webPush } from "./webPush";

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** Na web, app e API são a mesma origem: caminho relativo e cookie de sessão. */
const blockEndApi = (init: RequestInit) =>
  fetch("/api/push/fim-de-bloco", { credentials: "same-origin", ...init }).then(
    () => undefined,
    () => undefined,
  );

export const webPlatform: Platform = {
  native: false,
  syncStorage: browserSyncStorage,
  clearSyncStorage: clearBrowserSyncStorage,
  preferences: {
    get: (key) => storage()?.getItem(key) ?? null,
    set: (key, value) => storage()?.setItem(key, value),
    remove: (key) => storage()?.removeItem(key),
  },
  secureStorage: {
    async get(key) {
      return storage()?.getItem(key) ?? null;
    },
    async set(key, value) {
      storage()?.setItem(key, value);
    },
    async remove(key) {
      storage()?.removeItem(key);
    },
  },
  notifications: {
    async requestPermission() {
      if (!("Notification" in window)) return false;
      return (await Notification.requestPermission()) === "granted";
    },
    async show(title, body) {
      if ("Notification" in window && Notification.permission === "granted")
        new Notification(title, { body });
    },
  },
  // Com a aba fechada, quem avisa é o servidor (Web Push); sem avisos ligados, é ignorado.
  blockEnd: {
    schedule: (endsAt, subject) =>
      blockEndApi({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endsAt, subject }),
      }),
    cancel: () => blockEndApi({ method: "DELETE" }),
  },
  // Na web, o tempo aparece no título da aba (TimerTicker).
  studyTimer: {
    showRunning: async () => undefined,
    showPaused: async () => undefined,
    clear: async () => undefined,
    onPause: () => () => undefined,
  },
  reviewReminders: { set: async () => undefined },
  push: webPush,
  vibrate(pattern) {
    navigator.vibrate?.(pattern);
  },
};
