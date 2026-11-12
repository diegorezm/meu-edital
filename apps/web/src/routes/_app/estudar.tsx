import { StudyPage } from "@features/estudar";
import { searchText } from "@global/guards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/estudar")({
  validateSearch: (search: Record<string, unknown>): { bloco?: string; assunto?: string; tipo?: string } => ({
    bloco: searchText(search.bloco),
    assunto: searchText(search.assunto),
    tipo: searchText(search.tipo),
  }),
  component: function Estudar() {
    const search = Route.useSearch();
    // A chave recria a tela quando o ponto de partida muda.
    return <StudyPage key={`${search.bloco}-${search.assunto}`} search={search} />;
  },
});
