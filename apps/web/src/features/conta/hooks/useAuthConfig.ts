import { type PublicConfig, publicConfig } from "@global/api";
import { useEffect, useState } from "react";

const fallback: PublicConfig = {
  turnstileSiteKey: null,
  googleEnabled: false,
  emailEnabled: false,
  signupOpen: false,
  vapidPublicKey: null,
};

/** A configuração pública e se ela já chegou (para não piscar a tela errada). */

export function useAuthConfig(): PublicConfig & { loaded: boolean } {
  const [config, setConfig] = useState({ ...fallback, loaded: false });
  useEffect(() => {
    let active = true;
    publicConfig()
      .then((value) => active && setConfig({ ...value, loaded: true }))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return config;
}
