import { ResetPasswordPage } from "@features/conta";
import { searchText } from "@global/guards";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: (search: Record<string, unknown>): { token?: string; error?: string } =>
    ({
    token: searchText(search.token),
    error: searchText(search.error),
  }),
  component: function RedefinirSenha() {
    const { token, error } = Route.useSearch();
    return <ResetPasswordPage token={token} error={error} />;
  },
});
