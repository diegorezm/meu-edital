import { PermissionsAndroid, Platform } from "react-native";
import StudyTimerModule from "../../../../modules/study-timer";

async function canNotify(request: boolean): Promise<boolean> {
  if (!StudyTimerModule) return false;
  if (Number(Platform.Version) < 33) return true;
  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  if (await PermissionsAndroid.check(permission)) return true;
  if (!request) return false;
  return (
    (await PermissionsAndroid.request(permission)) ===
    PermissionsAndroid.RESULTS.GRANTED
  );
}

export async function showRunningNotification(
  startedAt: number,
  elapsedMs: number,
  subject: string,
  requestPermission = false,
): Promise<boolean> {
  if (!(await canNotify(requestPermission))) return false;
  await StudyTimerModule!.showRunning(startedAt, elapsedMs, subject);
  return true;
}

export async function showPausedNotification(
  elapsedMs: number,
  subject: string,
): Promise<void> {
  if (await canNotify(false)) {
    await StudyTimerModule!.showPaused(elapsedMs, subject);
  }
}

export async function clearStudyNotification(): Promise<void> {
  await StudyTimerModule?.clear();
}
