import { Mascot, Sheet } from "@meu-edital/ui";
import clsx from "clsx";
import type { AchievementsScreen } from "../hooks/useAchievements";

const hatNames = { capelo: "capelo", mago: "chapéu de mago", coroa: "coroa" } as const;

/** Mural de selos e gabinete. Emblemas definitivos virão como arte; até lá, a inicial. */
export function AchievementsView({ screen }: { screen: AchievementsScreen }) {
  const { view } = screen;
  return (
    <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Sheet title={`Conquistas · ${view.unlocked} de ${view.total}`}>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
          {view.achievements.map((a) => (
            <li
              key={a.id}
              className={clsx(
                "rounded-[6px] border-2 border-ink px-1.5 py-2.5 text-center",
                a.unlocked ? "bg-paper-raised" : "border-dashed bg-paper-sunken text-ink-muted",
              )}
              title={a.description}
            >
              <span
                className={clsx(
                  "font-title mx-auto mb-1.5 grid size-12 place-items-center rounded-full border-2 border-ink text-display-md",
                  a.unlocked ? "bg-gold text-ink" : "bg-paper-sunken",
                )}
                aria-hidden
              >
                {a.initial}
              </span>
              <b className="block text-sm font-extrabold">{a.title}</b>
              <span className="block text-xs">{a.description}</span>
              <span className="mt-1 block text-xs font-bold">{a.progressText}</span>
            </li>
          ))}
        </ul>
      </Sheet>
      <Sheet title="Gabinete" tone="maroon">
        <p className="mb-3 text-sm text-ink-muted">
          Chapéu da patente: {hatNames[view.hat]} ({view.rank}). As skins são só aparência e liberam com o nível.
        </p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Skin do mascote">
          {view.skins.map((s) => {
            const active = view.skin === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!s.unlocked}
                onClick={() => screen.choose(s.id)}
                className={clsx(
                  "rounded-[6px] border-2 border-ink p-2 text-center text-sm font-bold",
                  active
                    ? "bg-maroon text-paper-raised"
                    : s.unlocked
                      ? "cursor-pointer bg-paper-raised hover:bg-card-now"
                      : "cursor-not-allowed border-dashed bg-paper-sunken text-ink-muted",
                )}
              >
                <Mascot skin={s.id} hat={view.hat} className={clsx("mx-auto w-20", !s.unlocked && "opacity-50 grayscale")} />
                {s.name}
                {!s.unlocked && <span className="block text-xs font-medium">nível {s.from}</span>}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
