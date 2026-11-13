import { QueryClient } from "@tanstack/react-query";

/**
 * Cache das chamadas comuns à API (configuração, propostas, conexões).
 * Os dados de estudo não passam por aqui: eles vão pelo sync (`useStore`).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
