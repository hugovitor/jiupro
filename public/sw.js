self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("tatamex-aluno-v1").then((cache) => cache.addAll(["/aluno", "/icon.svg"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== "tatamex-aluno-v1").map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match("/aluno").then((cached) => cached || Response.error())),
  );
});
