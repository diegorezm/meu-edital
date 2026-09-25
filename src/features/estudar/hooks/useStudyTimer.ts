import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";

import {
  clearStudyNotification,
  showPausedNotification,
  showRunningNotification,
} from "../services/studyNotification";

const TIMER_KEY = "@meu-edital:study-timer:v1";

type TimerState = { elapsedMs: number; startedAt: number | null };

function getElapsedMs(timer: TimerState, now = Date.now()) {
  return timer.elapsedMs + (timer.startedAt ? Math.max(0, now - timer.startedAt) : 0);
}

export function useStudyTimer(subject: string) {
  const [timer, setTimer] = useState<TimerState | null>(null);
  const timerRef = useRef<TimerState | null>(null);
  const [now, setNow] = useState(0);
  const [ready, setReady] = useState(false);
  const [notificationUnavailable, setNotificationUnavailable] = useState(false);

  const commit = useCallback(async (next: TimerState | null) => {
    timerRef.current = next;
    setTimer(next);
    if (next) {
      await AsyncStorage.setItem(TIMER_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(TIMER_KEY);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(TIMER_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored) {
          const saved: TimerState = JSON.parse(stored);
          if (
            Number.isFinite(saved.elapsedMs) &&
            saved.elapsedMs >= 0 &&
            (saved.startedAt === null ||
              (Number.isFinite(saved.startedAt) && saved.startedAt > 0))
          ) {
            timerRef.current = saved;
            setTimer(saved);
            setNow(Date.now());
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!timer?.startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [timer?.startedAt]);

  useEffect(() => {
    if (!ready || !timer?.startedAt) return;
    showRunningNotification(timer.startedAt, timer.elapsedMs, subject).catch(() => {});
  }, [ready, timer?.startedAt, timer?.elapsedMs, subject]);

  const toggle = useCallback(async () => {
    if (!ready) return;
    const current = timerRef.current;
    if (current?.startedAt) {
      const next = { elapsedMs: getElapsedMs(current), startedAt: null };
      await commit(next);
      await showPausedNotification(next.elapsedMs, subject).catch(() => {});
    } else {
      const next = { elapsedMs: current?.elapsedMs || 0, startedAt: Date.now() };
      await commit(next);
      setNow(Date.now());
      const shown = await showRunningNotification(
        next.startedAt,
        next.elapsedMs,
        subject,
        true,
      ).catch(() => false);
      setNotificationUnavailable(Platform.OS === "android" && !shown);
    }
  }, [commit, ready, subject]);

  const pause = useCallback(async () => {
    const current = timerRef.current;
    if (!current?.startedAt) {
      return current ? Math.floor(current.elapsedMs / 1000) : 0;
    }
    const next = { elapsedMs: getElapsedMs(current), startedAt: null };
    await commit(next);
    await showPausedNotification(next.elapsedMs, subject).catch(() => {});
    return Math.floor(next.elapsedMs / 1000);
  }, [commit, subject]);

  const reset = useCallback(async () => {
    await commit(null);
    await clearStudyNotification().catch(() => {});
    setNotificationUnavailable(false);
  }, [commit]);

  return {
    ready,
    running: Boolean(timer?.startedAt),
    seconds: timer ? Math.floor(getElapsedMs(timer, now) / 1000) : 0,
    notificationUnavailable,
    toggle,
    pause,
    reset,
  };
}
