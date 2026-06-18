const CACHE_NAME = "aas-v1";
const RUNTIME_CACHE = "aas-runtime";
const ASSETS_CACHE = "aas-assets";

const STATIC_ASSETS = ["/", "/index.html", "/globals.css"];

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (name) =>
              name !== CACHE_NAME &&
              name !== RUNTIME_CACHE &&
              name !== ASSETS_CACHE
          )
          .map((name) => {
            console.log("Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (request.url.includes("/api/") && request.method === "GET") {
    event.respondWith(networkFirstAPI(request));
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cacheName =
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
      ? ASSETS_CACHE
      : RUNTIME_CACHE;

  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log("Network failed, trying cache:", request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    if (request.destination === "document") {
      return caches.match("/");
    }

    return new Response("Network error and no cache available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(ASSETS_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("Network error", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log("API network failed, trying cache:", request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error: "Network unavailable",
        cached: false,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/.test(
    pathname
  );
}
