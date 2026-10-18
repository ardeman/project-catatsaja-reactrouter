// Service worker: lets the installed app open without a connection.
// - Pages: network first, so an online visit always gets the latest
//   deploy; the cached copy is used only when offline.
// - /assets/*: hashed file names that never change, so cache first.
// - Everything else (Firebase, Firestore, fonts, other sites) is not
//   touched and goes to the network as usual.
// - Push: shows the notifications sent through Firebase Cloud Messaging
//   (invitations, health reminders) and opens their page when tapped.

const PAGES = 'pages-v2'
const ASSETS = 'assets-v1'
// The app shell served for every client-rendered route.
const FALLBACK = '/__spa-fallback.html'
// Pages rendered at build time, served as their own files.
const PUBLIC_PAGES = new Set([
  '/',
  '/about',
  '/help',
  '/privacy',
  '/terms',
  '/changelog',
])
const MAX_ASSETS = 200

// Stores the shell, the public pages and the files they load, so the app
// can start offline and the public pages open even if never visited.
const cachePage = async (path) => {
  const response = await fetch(path, { cache: 'no-cache' })
  if (!response.ok) return []
  const pages = await caches.open(PAGES)
  await pages.put(path, response.clone())
  const html = await response.text()
  return [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
    (match) => match[1],
  )
}

const cacheShell = async () => {
  const files = await Promise.all(
    [FALLBACK, ...PUBLIC_PAGES].map((path) => cachePage(path).catch(() => [])),
  )
  const assets = await caches.open(ASSETS)
  await Promise.all(
    [...new Set(files.flat())].map((file) =>
      assets.add(file).catch(() => undefined),
    ),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PAGES && key !== ASSETS)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

const pathOf = (url) => url.pathname.replace(/(.)\/+$/, '$1')

const handlePage = async (request) => {
  const url = new URL(request.url)
  const path = pathOf(url)
  // Public pages are their own files; every other route is the shell.
  const key = PUBLIC_PAGES.has(path) ? path : FALLBACK
  try {
    const response = await fetch(request)
    if (response.ok) {
      const pages = await caches.open(PAGES)
      await pages.put(key, response.clone())
    }
    return response
  } catch (error) {
    const cached = (await caches.match(key)) || (await caches.match(FALLBACK))
    if (cached) return cached
    throw error
  }
}

const handleAsset = async (request) => {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const assets = await caches.open(ASSETS)
    await assets.put(request, response.clone())
    // Old deploys leave files behind; drop the oldest beyond the limit.
    const keys = await assets.keys()
    await Promise.all(
      keys
        .slice(0, Math.max(0, keys.length - MAX_ASSETS))
        .map((key) => assets.delete(key)),
    )
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(handlePage(request))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(handleAsset(request))
  }
})

// Cloud Messaging sends `{ data: { title, body, link } }`. The text is
// written by the server in the device's language and never holds what an
// item says.
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // Not from the app: nothing to show.
  }
  const data = payload.data ?? payload.notification ?? {}
  if (!data.title) return
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/android-chrome-192x192.png',
      tag: data.tag,
      data: { link: data.link },
    }),
  )
})

// Only the app's own pages open: a link to another site is ignored.
const linkOf = (notification) => {
  try {
    const url = new URL(notification.data?.link ?? '/', self.location.origin)
    return url.origin === self.location.origin ? url.href : self.location.origin
  } catch {
    return self.location.origin
  }
}

// Tapping a notification goes to its page in an open window of the app, or
// opens one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = linkOf(event.notification)
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find((client) => 'navigate' in client)
        if (!open) return self.clients.openWindow(link)
        // A window this worker doesn't control can't be navigated.
        return open
          .focus()
          .then(() => open.navigate(link))
          .catch(() => self.clients.openWindow(link))
      }),
  )
})
