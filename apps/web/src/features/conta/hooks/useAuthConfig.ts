import { type PublicConfig, publicConfigQuery } from "@global/api";
import { useQuery } from "@tanstack/react-query";

const fallback: PublicConfig = {
  turnstileSiteKey: null,
  googleEnabled: false,
  emailEnabled: false,
  signupOpen: false,
  vapidPublicKey: null,
};

/** A configuração pública e se ela já chegou (para não piscar a tela errada). */
export function useAuthConfig(): PublicConfig & {
  loaded: boolean;
  failed: boolean;
  retry: () => void;
} {
  const { data, isError, refetch } = useQuery(publicConfigQuery);
  return {
    ...(data ?? fallback),
    loaded: Boolean(data),
    failed: isError && !data,
    retry: () => void refetch(),
  };
}
