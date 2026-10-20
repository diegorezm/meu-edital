import {
  Caveat_500Medium,
} from "@expo-google-fonts/caveat";
import { CourierPrime_400Regular } from "@expo-google-fonts/courier-prime";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";

/**
 * Famílias do app. Cada peso é uma família própria: no Android, `fontWeight`
 * não escolhe o arquivo certo de uma fonte carregada.
 */
export const fonts = {
  /** Texto corrido, dados e rótulos. */
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
  /** Títulos, com cara de documento impresso. */
  serif: "Newsreader_600SemiBold",
  serifMedium: "Newsreader_500Medium",
  /** Anotações da pessoa, como em máquina de escrever. */
  typewriter: "CourierPrime_400Regular",
  /** Anotação à mão, em vermelho. Usar pouco. */
  hand: "Caveat_500Medium",
} as const;

export const fontFiles = {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  CourierPrime_400Regular,
  Caveat_500Medium,
};
