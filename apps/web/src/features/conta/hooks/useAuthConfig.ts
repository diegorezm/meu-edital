import { type PublicConfig, publicConfig } from "@global/api";
import { useEffect, useState } from "react";

const fallback: PublicConfig = { turnstileSiteKey: null, googleEnabled: false, emailEnabled: false };

export function useAuthConfig(): PublicConfig {
  const [config, setConfig] = useState(fallback);
  useEffect(() => {
    let active = true;
    publicConfig()
      .then((value) => active && setConfig(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return config;
}
