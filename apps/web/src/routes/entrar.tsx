import { SignInPage } from "@features/conta";
import { requireGuest, searchText } from "@global/guards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>): { aviso?: string; volta?: string } => ({
    aviso: searchText(search.aviso),
    volta: searchText(search.volta),
  }),
  beforeLoad: async ({ search }) => {
    // Já logado e vindo da autorização do Oráculo: segue direto para ela.
    if (search.volta?.startsWith("/authorize?")) {
      try {
        await requireGuest();
      } catch {
        window.location.assign(search.volta);
      }
      return;
    }
    await requireGuest();
  },
  component: function Entrar() {
    const { aviso, volta } = Route.useSearch();
    return <SignInPage aviso={aviso} volta={volta} />;
  },
});
