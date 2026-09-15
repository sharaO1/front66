const CACHE_NAME = "stockmind-v3";
const APP_SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  const isAppAsset = ["style", "script", "font", "image"].includes(request.destination);
  const isNavigation = request.mode === "navigate";
  if (!isAppAsset && !isNavigation) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }

          const responseForCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseForCache));
          return response;
        })
        .catch(() => (isNavigation ? caches.match("/") : Response.error()));
    }),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const notificationData = event.data.json();
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: "/icons/app-icon.svg",
      badge: "/icons/app-icon.svg",
      vibrate: [100, 50, 100],
      data: { url: notificationData.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
