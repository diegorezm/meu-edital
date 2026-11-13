import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { SplashScreen } from "@capacitor/splash-screen";

type Navigate = (path: string) => void;

/**
 * Comportamento de app no Android e no iOS: botão voltar, links que abrem o
 * app (meuedital:// e links universais), toque em notificação e a tela de
 * abertura. Só roda no app nativo.
 */
export function setupNativeShell(navigate: Navigate) {
  void App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else void App.minimizeApp();
  });

  void App.addListener("appUrlOpen", ({ url }) => {
    try {
      const parsed = new URL(url);
      // meuedital://estudar → /estudar; https://.../revisoes → /revisoes
      const path = parsed.protocol === "meuedital:" ? `/${parsed.host}${parsed.pathname}` : parsed.pathname;
      navigate(`${path.replace(/\/+$/, "") || "/"}${parsed.search}`);
    } catch {
      // Link que não é do app: ignora.
    }
  });

  void LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
    const url = (notification.extra as { url?: string } | undefined)?.url;
    if (url) navigate(url);
  });

  void SplashScreen.hide();
}
