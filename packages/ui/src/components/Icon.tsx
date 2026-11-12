import clsx from "clsx";

/**
 * Ícones de traço, 24 × 24, espessura 2, pontas arredondadas, na cor do texto.
 * O conjunto base é o de docs/design-system/index.html; os de ação (mais,
 * fechar, editar...) seguem o mesmo traço.
 */
const paths = {
  castle: <><path d="M4 20V9h3V6h3v3h4V6h3v3h3v11Z" /><path d="M10 20v-5h4v5" /></>,
  map: <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z" /><path d="M9 4v14M15 6v14" /></>,
  sword: <path d="M19 4L9 14M19 4v3M19 4h-3M6 12l6 6M4 20l4-4" />,
  scroll: (
    <>
      <path d="M17 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8h3V6a2 2 0 0 0-2-2" />
      <path d="M8 9h5M8 13h5" />
    </>
  ),
  skull: (
    <>
      <path d="M12 3a7 7 0 0 0-7 7c0 3 1.5 4.5 3 5.5V19h8v-3.5c1.5-1 3-2.5 3-5.5a7 7 0 0 0-7-7Z" />
      <circle cx="9.2" cy="10.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="10.5" r="1.7" fill="currentColor" stroke="none" />
      <path d="M11 19v-2M13 19v-2" />
    </>
  ),
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" /><path d="M4 21V5M8 7h7" /></>,
  chart: <path d="M4 4v16h16M8 16v-5M12 16V8M16 16v-9" />,
  cup: <path d="M7 4h10v5a5 5 0 0 1-10 0ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M3 20a6 6 0 0 1 12 0M15 15.5a5 5 0 0 1 6 4.5" />
    </>
  ),
  orb: <><circle cx="12" cy="10" r="7" /><path d="M7 20h10M9 17h6M10 7l1 2 2 1-2 1-1 2" /></>,
  lock: (
    <>
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </>
  ),
  coin: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /></>,
  flame: (
    <path d="M12 3c3 4 5 6 5 9.5a5 5 0 0 1-10 0c0-2 1-3 2-5 .8 1.5 1.6 1.8 2-.2.3-1.6.3-2.8 1-4.3Z" />
  ),
  glass: <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />,
  quill: <path d="M20 4c-8 0-13 5-14 13l-2 3M6 17c5 0 9-2 11-6" />,
  star: (
    <path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8Z" />
  ),
  check: <path d="M5 12l5 5 9-10" />,
  more: <path d="M5 7h14M5 12h14M5 17h14" />,
  caret: <path d="M6 9l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  pencil: <path d="M4 20l4-1L19 8l-3-3L5 16ZM14 7l3 3" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />,
  play: <path d="M7 4l13 8-13 8Z" />,
  pause: <path d="M8 4v16M16 4v16" />,
  back: <path d="M15 5l-7 7 7 7" />,
  exit: <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />,
  sync: <path d="M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5" />,
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className,
  title,
}: {
  name: IconName;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("size-[18px] flex-none", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}
