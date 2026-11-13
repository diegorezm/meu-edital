import { Capacitor } from "@capacitor/core";
import { nativePlatform } from "./native";
import { webPlatform } from "./web";

export type { Platform } from "./types";

/** Implementação da plataforma atual: navegador ou app nativo (Capacitor). */
export const platform = Capacitor.isNativePlatform() ? nativePlatform : webPlatform;
