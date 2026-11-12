import {
  BottomSheet,
  Icon,
  NavItemContent,
  navItemClass,
  TabItemContent,
  tabItemClass,
} from "@meu-edital/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { isActive, NAV, type NavEntry } from "./navEntries";

function usePathname() {
  return useRouterState({ select: (state) => state.location.pathname });
}

const badgeFor = (entry: NavEntry, dueReviews: number) =>
  entry.soon ? "em breve" : entry.to === "/revisoes" && dueReviews ? dueReviews : undefined;

/** Navegação lateral do desktop, em uma folha abaixo da ficha. */
export function SideNav({ dueReviews }: { dueReviews: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Páginas" className="grid gap-0.5">
      {NAV.map((entry) => {
        const active = isActive(pathname, entry.to);
        return (
          <Link key={entry.to} to={entry.to} className={navItemClass(active)} aria-current={active ? "page" : undefined}>
            <NavItemContent icon={entry.icon} label={entry.label} badge={badgeFor(entry, dueReviews)} active={active} />
          </Link>
        );
      })}
      <div className="my-1 border-t-[1.5px] border-dashed border-rule" />
      <Link
        to="/conta"
        className={navItemClass(isActive(pathname, "/conta"))}
        aria-current={isActive(pathname, "/conta") ? "page" : undefined}
      >
        <NavItemContent icon="exit" label="Conta" active={isActive(pathname, "/conta")} />
      </Link>
    </nav>
  );
}

/** Barra inferior do celular: cinco placas, Estudar em destaque no centro, e Mais. */
export function TabBar({ dueReviews }: { dueReviews: number }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const tabs = NAV.filter((entry) => entry.tab);
  const rest = NAV.filter((entry) => !entry.tab);
  const restActive = rest.some((entry) => isActive(pathname, entry.to)) || isActive(pathname, "/conta");
  return (
    <>
      <nav
        aria-label="Páginas"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-1 border-t-[3px] border-ink bg-paper px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        {tabs.slice(0, 2).map((entry) => (
          <TabLink key={entry.to} entry={entry} active={isActive(pathname, entry.to)} />
        ))}
        <TabLink entry={tabs[2]} active={isActive(pathname, tabs[2].to)} highlight />
        <TabLink
          entry={tabs[3]}
          active={isActive(pathname, tabs[3].to)}
          label={dueReviews ? `Revisões (${dueReviews})` : undefined}
        />
        <button type="button" onClick={() => setMore(true)} className={tabItemClass(restActive)}>
          <TabItemContent icon="more" label="Mais" />
        </button>
      </nav>
      <BottomSheet open={more} onOpenChange={setMore} title="Mais">
        <div className="grid grid-cols-2 gap-2">
          {[...rest, { to: "/conta" as const, label: "Conta", icon: "exit" as const }].map((entry) => (
            <Link
              key={entry.to}
              to={entry.to}
              onClick={() => setMore(false)}
              className={navItemClass(isActive(pathname, entry.to))}
            >
              <Icon name={entry.icon} />
              {entry.label}
              {"soon" in entry && entry.soon && <span className="ml-auto text-xs font-medium">em breve</span>}
            </Link>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

function TabLink({
  entry,
  active,
  highlight,
  label,
}: {
  entry: NavEntry;
  active: boolean;
  highlight?: boolean;
  label?: string;
}) {
  return (
    <Link
      to={entry.to}
      className={tabItemClass(active, highlight)}
      aria-current={active ? "page" : undefined}
      aria-label={label}
    >
      <TabItemContent icon={entry.icon} label={entry.label} />
    </Link>
  );
}
