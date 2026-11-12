import clsx from "clsx";
import type { ReactNode } from "react";

/** Aviso dentro de uma folha: informação neutra ou erro. */
export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded border-2 border-dashed px-3 py-2 text-sm font-bold",
        tone === "error" ? "border-rose-strong text-rose-strong" : "border-rule text-ink-muted",
      )}
    >
      {children}
    </p>
  );
}
