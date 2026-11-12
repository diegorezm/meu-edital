import { SignInPage } from "@features/conta";
import { searchText, requireGuest } from "@global/guards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>): { aviso?: string } =>
    ({ aviso: searchText(search.aviso) }),
  beforeLoad: requireGuest,
  component: function Entrar() {
    return <SignInPage aviso={Route.useSearch().aviso} />;
  },
});
