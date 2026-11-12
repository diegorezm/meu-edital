import { useEffect, useRef } from "react";

type TurnstileApi = {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | undefined;
const loadScript = () =>
  (loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile indisponível"));
    document.head.appendChild(script);
  }));

/** Verificação anti-robô da Cloudflare, usada no cadastro e na recuperação de senha. */
export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let widget: string | undefined;
    loadScript()
      .then(() => {
        if (!box.current || !window.turnstile) return;
        widget = window.turnstile.render(box.current, {
          sitekey: siteKey,
          language: "pt-br",
          callback: onToken,
          "expired-callback": () => onToken(""),
        });
      })
      .catch(() => onToken(""));
    return () => {
      if (widget) window.turnstile?.remove(widget);
    };
  }, [siteKey, onToken]);
  return <div ref={box} className="min-h-[65px]" />;
}
