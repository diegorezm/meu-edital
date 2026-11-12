import { HomePage } from "@features/inicio";
import { searchText } from "@global/guards";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  // O site de divulgação linka para /?conta=criar e /?conta=entrar.
  validateSearch: (search: Record<string, unknown>): { conta?: string } => ({
    conta: searchText(search.conta),
  }),
  beforeLoad: ({ search }) => {
    if (search.conta === "criar") throw redirect({ to: "/criar-conta" });
    if (search.conta === "entrar") throw redirect({ to: "/entrar" });
  },
  component: HomePage,
});
