import { UnderConstruction } from "@global/components/UnderConstruction";
import { searchText } from "@global/guards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/estudar")({
  validateSearch: (search: Record<string, unknown>): { bloco?: string } => ({
    bloco: searchText(search.bloco),
  }),
  component: () => <UnderConstruction title="Estudar" />,
});
