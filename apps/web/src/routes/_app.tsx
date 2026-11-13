import { AppShell } from "@global/components/AppShell";
import { AppSkeleton } from "@global/components/AppSkeleton";
import { LegalGate } from "@global/legal/LegalGate";
import { requireSession } from "@global/guards";
import { StoreProvider } from "@global/store/StoreProvider";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

/** Área logada: exige sessão, abre o banco local do usuário e desenha o shell. */
export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    // O site de divulgação linka para /?conta=criar e /?conta=entrar; isso
    // vale antes de exigir sessão.
    const conta = (location.search as { conta?: unknown }).conta;
    if (conta === "criar") throw redirect({ to: "/criar-conta" });
    if (conta === "entrar") throw redirect({ to: "/entrar" });
    return requireSession();
  },
  // Enquanto confere a sessão no recarregamento; navegações com a sessão em cache não chegam a mostrar.
  pendingComponent: AppSkeleton,
  pendingMs: 150,
  pendingMinMs: 0,
  component: function AppArea() {
    const { user } = Route.useRouteContext();
    return (
      <StoreProvider userId={user.id}>
        <AppShell>
          <Outlet />
        </AppShell>
        <LegalGate />
      </StoreProvider>
    );
  },
});
