/** Cores da marca, usadas pelo app e pelo site. */
export const palette = {
  bg: "#F7F7F2",
  panel: "#FFFFFF",
  line: "#E7E9E4",
  text: "#202731",
  muted: "#747D83",
  accent: "#88A9F1",
  dark: "#202731",
  danger: "#B96A66",
  blue: "#A9C3FC",
  lavender: "#DCD3FF",
  peach: "#FFD3A0",
  mint: "#C8EBD7",
};

export type PaletteColor = keyof typeof palette;

/** `{ bg: "#F7F7F2" }` → `--bg: #F7F7F2;`, para declarar as cores como variáveis CSS. */
export function cssVariables(colors: Record<string, string> = palette) {
  return Object.entries(colors)
    .map(([name, value]) => `--${name}: ${value};`)
    .join(" ");
}
