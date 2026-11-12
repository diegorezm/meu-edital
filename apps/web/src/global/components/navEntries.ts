import type { IconName } from "@meu-edital/ui";

export type NavPath =
  | "/"
  | "/jornada"
  | "/estudar"
  | "/revisoes"
  | "/semana"
  | "/simulados"
  | "/edital"
  | "/desempenho"
  | "/conquistas"
  | "/guilda"
  | "/oraculo"
  | "/conta";

export type NavEntry = {
  to: NavPath;
  label: string;
  icon: IconName;
  /** Placa da barra inferior no celular. */
  tab?: boolean;
  soon?: boolean;
};

/** Todas as páginas do app, na ordem da navegação lateral. */
export const NAV: NavEntry[] = [
  { to: "/", label: "Início", icon: "castle", tab: true },
  { to: "/jornada", label: "Jornada", icon: "map", tab: true },
  { to: "/estudar", label: "Estudar", icon: "sword", tab: true },
  { to: "/revisoes", label: "Revisões", icon: "scroll", tab: true },
  { to: "/semana", label: "Semana", icon: "glass" },
  { to: "/simulados", label: "Simulados", icon: "skull" },
  { to: "/edital", label: "Edital", icon: "book" },
  { to: "/desempenho", label: "Desempenho", icon: "chart" },
  { to: "/conquistas", label: "Conquistas", icon: "cup" },
  { to: "/guilda", label: "Guilda", icon: "people", soon: true },
  { to: "/oraculo", label: "Oráculo", icon: "orb" },
];

export const isActive = (pathname: string, to: string) =>
  to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
