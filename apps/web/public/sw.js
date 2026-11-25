// Service worker do Meu Edital: avisos de Web Push e cache seguro do app shell
// para abrir offline (nunca guarda respostas da API, OAuth ou MCP).
const SHELL_CACHE = "meu-edital-shell-v1";
const PRECACHE = ["/", "/manifest.webmanifest", "/icone-192.png", "/icone-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/oauth/") ||
    url.pathname.startsWith("/authorize") ||
    url.pathname.startsWith("/mcp") ||
    url.pathname.startsWith("/.well-known/")
  )
    return;

  // Navegação SPA: rede primeiro; sem rede, entrega o shell em cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(SHELL_CACHE).then((c) => c.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/").then((cached) => cached || Response.error())),
    );
    return;
  }

  // Assets estáticos (/assets/*, ícones, fontes): cache primeiro com atualização em segundo plano.
  if (url.pathname.startsWith("/assets/") || PRECACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              void caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
            }
            return response;
          })
          .catch(() => cached || Response.error());
        return cached || fetched;
      }),
    );
  }
});

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
  const parsed = new URL(event.notification.data?.url ?? "/", self.location.origin);
  const url = parsed.origin === self.location.origin ? parsed.href : self.location.origin;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) return open.focus().then(() => open.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
