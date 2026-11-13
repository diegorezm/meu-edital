// Service worker do Meu Edital: só mostra avisos de Web Push (fim de bloco e
// revisões vencidas) e abre o app no lugar certo ao tocar. Não guarda cache.

self.addEventListener("push", (event) => {
  let message = { title: "Meu Edital", body: "", url: "/" };
  try {
    message = { ...message, ...event.data.json() };
  } catch {
    // Aviso sem corpo: mostra o padrão.
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      icon: "/icone-192.png",
      badge: "/icone-192.png",
      data: { url: message.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) return open.focus().then(() => open.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
