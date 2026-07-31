// FloPay Wallet service worker — app-shell caching so the shell (and the
// last screen you had open) still loads offline. Not doing full API-response
// caching: wallet data must always be fresh, a stale balance is worse than
// no balance.
const CACHE_NAME = 'flopay-wallet-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept API calls — wallet data must come from the network or
  // fail loudly, not silently serve stale cached balances/transactions.
  if (url.pathname.startsWith('/api/')) return
  if (event.request.method !== 'GET') return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html').then((res) => res ?? Response.error())),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached ?? network
    }),
  )
})
