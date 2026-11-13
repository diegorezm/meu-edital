import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { loadSessionToken } from "@global/http";
import { queryClient } from "@global/query";
import { platform } from "@platform/index";
import { setupNativeShell } from "@platform/nativeShell";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// No app nativo, o token da sessão precisa estar carregado antes da primeira chamada.
void loadSessionToken().finally(() => {
  if (platform.native) setupNativeShell((path) => void router.navigate({ href: path }));
  createRoot(document.getElementById("app")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
