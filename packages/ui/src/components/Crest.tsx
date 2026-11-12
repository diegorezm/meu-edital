import clsx from "clsx";

/** As oito cores de matéria, na ordem de criação. A cor nunca vem sozinha: sempre com sigla. */
const fills = [
  "fill-subject-1",
  "fill-subject-2",
  "fill-subject-3",
  "fill-subject-4",
  "fill-subject-5",
  "fill-subject-6",
  "fill-subject-7",
  "fill-subject-8",
] as const;
const backgrounds = [
  "bg-subject-1",
  "bg-subject-2",
  "bg-subject-3",
  "bg-subject-4",
  "bg-subject-5",
  "bg-subject-6",
  "bg-subject-7",
  "bg-subject-8",
] as const;

export const subjectFill = (index: number) => fills[((index % 8) + 8) % 8];
export const subjectBackground = (index: number) => backgrounds[((index % 8) + 8) % 8];

/** Sigla de duas letras da matéria: "Português" → "Pt", "Direito Administrativo" → "DA". */
export function subjectInitials(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[\s.,/-]+/)
    .filter((word) => word.length > 2 || /^[A-Z]/.test(word));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const word = words[0] ?? name;
  const consonant = word.slice(1).match(/[bcdfghjklmnpqrstvwxyz]/i)?.[0] ?? word[1] ?? "";
  return (word[0] ?? "?").toUpperCase() + consonant.toLowerCase();
}

/** Brasão da matéria: escudo na cor dela, contorno de tinta e sigla em tinta. */
export function Crest({
  name,
  index,
  size = 46,
  showInitials = true,
  className,
}: {
  name: string;
  index: number;
  size?: number;
  showInitials?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 46 52"
      width={size}
      height={(size * 52) / 46}
      className={clsx(subjectFill(index), className)}
      role="img"
      aria-label={`Brasão de ${name}`}
    >
      <path
        d="M23 3l19 6v15c0 13-8 21-19 25C12 45 4 37 4 24V9Z"
        className="stroke-ink"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d="M23 8l14 4.5V24c0 10-6 16-14 19.5" fill="rgb(255 255 255 / .18)" stroke="none" />
      {showInitials && (
        <text
          x="23"
          y="33"
          textAnchor="middle"
          fill="var(--color-ink)"
          fontSize={22}
          style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.05em" }}
        >
          {subjectInitials(name)}
        </text>
      )}
    </svg>
  );
}
