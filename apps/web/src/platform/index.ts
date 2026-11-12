import { webPlatform } from "./web";

export type { Platform } from "./types";

/** Implementação da plataforma atual. A casca Capacitor troca esta linha. */
export const platform = webPlatform;
