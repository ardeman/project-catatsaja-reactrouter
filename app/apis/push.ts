import { firebase, useEmulators } from '~/lib/configs/firebase'
import { environment } from '~/lib/utils/environment'

// This device's push subscription, through Firebase Cloud Messaging on the
// app's own service worker (`public/sw.js`, which shows the notifications),
// not a separate `firebase-messaging-sw.js`. `firebase/messaging` loads only
// when push is used.
//
// The token is also kept in this browser while notifications are on, so
// the app can refresh it on start and remove it when signing out, even if
// the permission was taken back since.

const tokenStorageKey = 'push-token'

export const readSavedPushToken = () => {
  try {
    return localStorage.getItem(tokenStorageKey) ?? undefined
  } catch {
    return
  }
}

const rememberPushToken = (token?: string) => {
  try {
    if (token) localStorage.setItem(tokenStorageKey, token)
    else localStorage.removeItem(tokenStorageKey)
  } catch {
    // Storage blocked: the token is refreshed only while the page is open.
  }
}

// Whether this browser can get push notifications from the app. The
// emulators use a demo project that Cloud Messaging doesn't know.
export const isPushSupported = async () => {
  if (
    !firebase ||
    useEmulators ||
    !environment.VITE_FCM_VAPID_KEY ||
    !('serviceWorker' in navigator) ||
    !('Notification' in globalThis)
  )
    return false
  const { isSupported } = await import('firebase/messaging')
  return isSupported()
}

// The service worker is registered at start in production only; push
// registers it in development too.
const serviceWorker = async () =>
  (await navigator.serviceWorker.getRegistration('/')) ??
  (await navigator.serviceWorker.register('/sw.js'))

const messaging = async () => {
  if (!firebase) throw new Error('Firebase is not initialized.')
  const { getMessaging } = await import('firebase/messaging')
  return getMessaging(firebase)
}

// Asks for the permission if needed; undefined when it isn't given.
export const subscribeToPush = async () => {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return
  const { getToken } = await import('firebase/messaging')
  const token = await getToken(await messaging(), {
    vapidKey: environment.VITE_FCM_VAPID_KEY,
    serviceWorkerRegistration: await serviceWorker(),
  })
  rememberPushToken(token)
  return token
}

// The current token (Cloud Messaging renews it from time to time), without
// asking: undefined when notifications are off or the permission was taken
// back.
export const refreshPushToken = async () => {
  if (!readSavedPushToken() || Notification.permission !== 'granted') return
  const { getToken } = await import('firebase/messaging')
  const token = await getToken(await messaging(), {
    vapidKey: environment.VITE_FCM_VAPID_KEY,
    serviceWorkerRegistration: await serviceWorker(),
  })
  rememberPushToken(token)
  return token
}

export const unsubscribeFromPush = async () => {
  rememberPushToken()
  try {
    const { deleteToken } = await import('firebase/messaging')
    await deleteToken(await messaging())
  } catch {
    // Already gone, or the permission was taken back.
  }
}
