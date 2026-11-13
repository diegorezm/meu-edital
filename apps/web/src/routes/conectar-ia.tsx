import { ConsentPage } from "@features/conectar";
import { searchText } from "@global/guards";
import { createFileRoute } from "@tanstack/react-router";

/** Tela de consentimento do Oráculo. O Worker só manda para cá com sessão válida. */
export const Route = createFileRoute("/conectar-ia")({
  validateSearch: (search: Record<string, unknown>): { handle?: string; cliente?: string; destino?: string; escopos?: string } => ({
    handle: searchText(search.handle),
    cliente: searchText(search.cliente),
    destino: searchText(search.destino),
    escopos: searchText(search.escopos),
  }),
  component: function ConectarIa() {
    return <ConsentPage search={Route.useSearch()} />;
  },
});
