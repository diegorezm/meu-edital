/** Linha simples da nota dos simulados ao longo do tempo (0 a 100%). */
export function ScoreChart({ points }: { points: { label: string; score: number }[] }) {
  const width = 300;
  const height = 120;
  const pad = 10;
  const x = (i: number) => (points.length === 1 ? width / 2 : pad + (i * (width - 2 * pad)) / (points.length - 1));
  const y = (score: number) => height - pad - score * (height - 2 * pad);
  const last = points[points.length - 1];
  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full border-b-2 border-l-2 border-ink"
        role="img"
        aria-label={`Notas: ${points.map((p) => `${p.label} ${Math.round(p.score * 100)}%`).join(", ")}`}
      >
        <polyline
          points={points.map((p, i) => `${x(i)},${y(p.score)}`).join(" ")}
          fill="none"
          stroke="var(--color-teal-strong)"
          strokeWidth={3}
        />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.score)} r={5} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth={2} />
        ))}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-ink-muted">
        <span>{points[0].label}</span>
        <span>
          {last.label} · {Math.round(last.score * 100)}%
        </span>
      </figcaption>
    </figure>
  );
}
