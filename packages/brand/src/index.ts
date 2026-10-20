/**
 * Cores da marca, usadas pelo app e pelo site. O visual é de folha de prova:
 * papel creme, tinta de caneta azul, marca-texto e o vermelho da correção.
 */
export const palette = {
  /** Papel do fundo. */
  bg: "#F3EFE6",
  /** Papel dos cartões, um tom mais claro que o fundo. */
  panel: "#F8F5EE",
  /** Campo para escrever. */
  field: "#FBF9F4",
  /** Linha fina entre itens. */
  line: "#D9D2C3",
  /** Tracejado dos divisores. */
  rule: "#A8A293",
  /** Tinta de caneta: texto, contornos e ações. */
  ink: "#22304A",
  /** Tinta mais fraca, para texto de apoio longo. */
  inkSoft: "#4A5468",
  text: "#22304A",
  /** Lápis: rótulos e informações secundárias. */
  muted: "#7D786B",
  accent: "#22304A",
  dark: "#22304A",
  /** Vermelho de correção: erros, carimbos e anotações à mão. */
  danger: "#B0453A",
  /** Marca-texto amarelo, só para o dado mais importante. */
  highlight: "#F2DD6E",
  blue: "#D5DCEB",
  lavender: "#E2DCEC",
  peach: "#EFD9C6",
  mint: "#D6E2D0",
};

export type PaletteColor = keyof typeof palette;

/** Tons das matérias, mais fortes que os fundos: barras e marcadores. */
export const subjectTones = [
  "#8E9CC9",
  "#D9A48A",
  "#9DBFA6",
  "#B7A3D1",
  "#D8C27A",
  "#8FB5C2",
];

/** `{ bg: "#F3EFE6" }` → `--bg: #F3EFE6;`, para declarar as cores como variáveis CSS. */
export function cssVariables(colors: Record<string, string> = palette) {
  return Object.entries(colors)
    .map(([name, value]) => `--${name}: ${value};`)
    .join(" ");
}
export * from "./mark";
