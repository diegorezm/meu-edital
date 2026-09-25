export async function showRunningNotification(
  _startedAt: number,
  _elapsedMs: number,
  _subject: string,
  _url: string,
  _requestPermission = false,
): Promise<boolean> {
  return false;
}

export async function showPausedNotification(
  _elapsedMs: number,
  _subject: string,
  _url: string,
): Promise<void> {}

export async function clearStudyNotification(): Promise<void> {}
