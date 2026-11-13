/** Converte a chave pública VAPID (base64url) para o formato do PushManager. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64url.length / 4) * 4, "=");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const supported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function registration() {
  return navigator.serviceWorker.register("/sw.js");
}

/** Web Push na web. No app nativo, a casca troca por notificações locais e push do sistema. */
export const webPush = {
  supported,

  /** Endpoint da assinatura deste navegador, se houver. */
  async current(): Promise<string | null> {
    if (!supported()) return null;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    return sub?.endpoint ?? null;
  },

  /** Pede permissão e assina. Devolve a assinatura para o servidor, ou null se negada. */
  async subscribe(vapidPublicKey: string): Promise<PushSubscriptionJSON | null> {
    if (!supported()) return null;
    if ((await Notification.requestPermission()) !== "granted") return null;
    const reg = await registration();
    await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidPublicKey) }));
    return sub.toJSON();
  },

  /** Cancela a assinatura deste navegador e devolve o endpoint cancelado. */
  async unsubscribe(): Promise<string | null> {
    if (!supported()) return null;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return null;
    await sub.unsubscribe();
    return sub.endpoint;
  },
};
