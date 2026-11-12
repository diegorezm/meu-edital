import { CheckEmailPage } from "@features/conta";
import { searchText } from "@global/guards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/verifique-seu-email")({
  validateSearch: (search: Record<string, unknown>): { email?: string } =>
    ({ email: searchText(search.email) }),
  component: function VerifiqueSeuEmail() {
    return <CheckEmailPage email={Route.useSearch().email} />;
  },
});
