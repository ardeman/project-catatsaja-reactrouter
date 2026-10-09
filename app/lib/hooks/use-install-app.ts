import { useSyncExternalStore } from 'react'

// Chrome, Edge and Android fire `beforeinstallprompt` when the app can be
// installed; the app keeps it to show its own Install button. Safari on
// iPhone and iPad has no such event: people install with Share → Add to
// Home Screen, so the button shows those steps instead.

type TBeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let installPrompt: TBeforeInstallPromptEvent | undefined
const listeners = new Set<() => void>()
const notify = () => {
  for (const listener of listeners) listener()
}

// Called once at start-up (entry.client), before the event can fire.
export const listenForInstallPrompt = () => {
  globalThis.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt = event as TBeforeInstallPromptEvent
    notify()
  })
  globalThis.addEventListener('appinstalled', () => {
    installPrompt = undefined
    notify()
  })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const noSubscribe = () => () => {}

const isStandalone = () =>
  globalThis.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isAppleMobile = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac.
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const useInstallApp = () => {
  // Pages rendered at build time hide the button until the browser says
  // otherwise.
  const canPrompt = useSyncExternalStore(
    subscribe,
    () => installPrompt !== undefined,
    () => false,
  )
  const standalone = useSyncExternalStore(noSubscribe, isStandalone, () => true)
  const appleMobile = useSyncExternalStore(
    noSubscribe,
    isAppleMobile,
    () => false,
  )

  const install = async () => {
    if (!installPrompt) return
    const prompt = installPrompt
    await prompt.prompt()
    await prompt.userChoice
    installPrompt = undefined
    notify()
  }

  return {
    // Whether to offer installing at all.
    canInstall: !standalone && (canPrompt || appleMobile),
    // No prompt available: show the Add to Home Screen steps instead.
    needsInstructions: !canPrompt && appleMobile,
    install,
  }
}
