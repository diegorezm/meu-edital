import { AppShell } from "@global/components/AppShell";
import { requireSession } from "@global/guards";
import { StoreProvider } from "@global/store/StoreProvider";
import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Área logada: exige sessão, abre o banco local do usuário e desenha o shell. */
export const Route = createFileRoute("/_app")({
  beforeLoad: requireSession,
  component: function AppArea() {
    const { user } = Route.useRouteContext();
    return (
      <StoreProvider userId={user.id}>
        <AppShell>
          <Outlet />
        </AppShell>
      </StoreProvider>
    );
  },
});
