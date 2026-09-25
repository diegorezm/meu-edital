import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class StudyTimerModule extends NativeModule<{}> {
  showRunning(startedAt: number, elapsedMs: number, subject: string): Promise<void>;
  showPaused(elapsedMs: number, subject: string): Promise<void>;
  clear(): Promise<void>;
}

export default requireOptionalNativeModule<StudyTimerModule>('StudyTimer');
