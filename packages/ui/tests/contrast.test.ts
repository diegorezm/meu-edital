import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Lê os tokens do próprio tema para que mudar uma cor exija passar aqui.
const css = readFileSync(new URL("../src/theme.css", import.meta.url), "utf8");
const color = (name: string) => {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`Token --color-${name} não encontrado`);
  return match[1];
};

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(color(a)), luminance(color(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Combinações permitidas em docs/design-system/design-system.md (Acessibilidade).
const text: [string, string][] = [
  ["ink", "paper"],
  ["ink-muted", "paper"],
  ["ink-muted", "paper-sunken"],
  ["paper-raised", "teal-strong"],
  ["paper-raised", "maroon"],
  ["ink", "gold"],
  ["green-strong", "card-done"],
  ["rose-strong", "paper"],
  ["ink", "paper-raised"],
];
const largeText: [string, string][] = Array.from({ length: 8 }, (_, i) => [
  "ink",
  `subject-${i + 1}`,
]);
const forbidden: [string, string][] = [
  ["paper-raised", "teal"],
  ["rose", "paper"],
];

describe("contraste dos tokens (WCAG AA)", () => {
  it.each(text)("%s sobre %s chega a 4,5", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(largeText)("%s sobre %s chega a 3 (texto grande)", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });
  it.each(forbidden)("%s sobre %s continua proibido", (fg, bg) => {
    expect(contrast(fg, bg)).toBeLessThan(4.5);
  });
});
