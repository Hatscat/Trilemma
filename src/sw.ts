/**
 * Service worker: precaches the whole app at install time, then serves it cache-first (offline-first).
 * `__PRECACHE_URLS__` and `__CACHE_VERSION__` are injected at build time (see vite.config.ts).
 * This file must not import anything, so it builds into a single classic script.
 */

declare const __PRECACHE_URLS__: string[];
declare const __CACHE_VERSION__: string;

// Minimal service worker types: the project is type-checked with the DOM lib, not the WebWorker lib.
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}
interface FetchEvent extends ExtendableEvent {
  readonly request: Request;
  respondWith(response: Promise<Response>): void;
}
interface ServiceWorkerScope {
  readonly location: Location;
  readonly clients: { claim(): Promise<void> };
  skipWaiting(): Promise<void>;
  addEventListener(type: "install" | "activate", listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: "fetch", listener: (event: FetchEvent) => void): void;
}

const sw = self as unknown as ServiceWorkerScope;
const CACHE = `trilemma-${__CACHE_VERSION__}`;

sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(__PRECACHE_URLS__))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("trilemma-") && key !== CACHE) await caches.delete(key);
    }
    await sw.clients.claim();
  })());
});

sw.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== sw.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Some servers send "Vary: Origin"; module scripts carry an Origin header, the precache requests do not.
    const options = { ignoreVary: true };
    if (request.mode === "navigate") return (await cache.match("./index.html", options)) ?? fetch(request);
    return (await cache.match(request, options)) ?? fetch(request);
  })());
});

export {};
