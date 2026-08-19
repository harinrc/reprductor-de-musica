const CACHE = "duoplayer-v33";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./config.js",
  "./manifest.webmanifest",
  "./icon-192.svg",
  "./icon-512.svg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // Solo se cachea el shell propio: los streams y APIs externas no deben guardarse.
  const cacheable = url.origin === self.location.origin && !event.request.headers.has("range");

  if (!cacheable) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});

async function notifyClients(type) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => {
    client.postMessage({ type });
  });
}

self.addEventListener("notificationclick", (event) => {
  const action = event.action || "";
  event.notification.close();

  event.waitUntil((async () => {
    if (action === "previous") {
      await notifyClients("playback:previous");
      return;
    }
    if (action === "next") {
      await notifyClients("playback:next");
      return;
    }
    if (action === "play") {
      await notifyClients("playback:play");
      return;
    }
    if (action === "pause") {
      await notifyClients("playback:pause");
      return;
    }

    const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (windowClients.length > 0) {
      const first = windowClients[0];
      await first.focus();
      await notifyClients("playback:toggle");
      return;
    }

    const newClient = await self.clients.openWindow("./");
    if (newClient) {
      await notifyClients("playback:toggle");
    }
  })());
});
