import { CookieBanner } from "@global/legal/CookieBanner";
import { Button, buttonClass, Notice, Sheet } from "@meu-edital/ui";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

function RootError({ error, reset }: { error: unknown; reset: () => void }) {
  console.error("Erro na interface", error);
  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Sheet title="Algo saiu do esperado">
        <div className="grid gap-4">
          <Notice tone="error">
            Aconteceu um erro inesperado nesta tela. Seus dados continuam salvos.
          </Notice>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset}>Tentar novamente</Button>
            <Link to="/" className={buttonClass("quiet")}>
              Voltar ao início
            </Link>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Sheet title="Página não encontrada">
        <div className="grid gap-4">
          <p className="text-sm text-ink-muted">Não encontramos este endereço no Meu Edital.</p>
          <Link to="/" className={buttonClass("primary")}>
            Ir para o início
          </Link>
        </div>
      </Sheet>
    </div>
  );
}

export const Route = createRootRoute({
  errorComponent: RootError,
  notFoundComponent: NotFound,
  component: () => (
    <>
      <Outlet />
      <CookieBanner />
    </>
  ),
});
