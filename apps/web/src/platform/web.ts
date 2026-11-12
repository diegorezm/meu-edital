import type { Platform } from "./types";

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const webPlatform: Platform = {
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
  vibrate(pattern) {
    navigator.vibrate?.(pattern);
  },
};
