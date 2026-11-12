import { AccountPage } from "@features/conta";
import { searchText, requireSession } from "@global/guards";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  // O site de divulgação linka para /?conta=criar e /?conta=entrar.
  validateSearch: (search: Record<string, unknown>): { conta?: string } =>
    ({ conta: searchText(search.conta) }),
  beforeLoad: async ({ search }) => {
    if (search.conta === "criar") throw redirect({ to: "/criar-conta" });
    if (search.conta === "entrar") throw redirect({ to: "/entrar" });
    await requireSession();
  },
  component: AccountPage,
});
