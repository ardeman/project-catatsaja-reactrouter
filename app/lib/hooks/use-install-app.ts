import { useSyncExternalStore } from 'react'

// Chrome, Edge and Android fire `beforeinstallprompt` when the app can be
// installed; the app keeps it to show the browser's own install prompt.
// Elsewhere (Safari, Firefox on Android, Chrome before it offers the
// prompt) the Install button shows the browser's own steps instead.

// Which steps to show when there is no install prompt.
export type TInstallSteps =
  'appleMobile' | 'safariMac' | 'chromium' | 'firefoxAndroid'

type TBeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// The prompt the browser offered, until it is used or the app is installed.
const pending: { prompt?: TBeforeInstallPromptEvent } = {}
const listeners = new Set<() => void>()
const notify = () => {
  for (const listener of listeners) listener()
}

// Called once at start-up (entry.client), before the event can fire.
export const listenForInstallPrompt = () => {
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    pending.prompt = event as TBeforeInstallPromptEvent
    notify()
  })
  addEventListener('appinstalled', () => {
    pending.prompt = undefined
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
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

// null: this browser can't install web apps (e.g. Firefox on desktop).
const detectSteps = (): TInstallSteps | null => {
  const agent = navigator.userAgent
  // iPadOS reports itself as a Mac.
  const isAppleMobile =
    /iphone|ipad|ipod/i.test(agent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isAppleMobile) return 'appleMobile'
  if (/firefox/i.test(agent)) {
    return /android/i.test(agent) ? 'firefoxAndroid' : null
  }
  if (/chrome|chromium|crios|edg|opr|samsungbrowser/i.test(agent)) {
    return 'chromium'
  }
  return /macintosh/i.test(agent) && /safari/i.test(agent) ? 'safariMac' : null
}

// Whether the app runs installed (its own window, no browser bars). Pages
// rendered at build time assume a browser tab.
export const useIsStandalone = () =>
  useSyncExternalStore(noSubscribe, isStandalone, () => false)

export const useInstallApp = () => {
  // Pages rendered at build time hide the button until the browser says
  // otherwise.
  const canPrompt = useSyncExternalStore(
    subscribe,
    () => pending.prompt !== undefined,
    () => false,
  )
  const standalone = useSyncExternalStore(noSubscribe, isStandalone, () => true)
  const steps = useSyncExternalStore(noSubscribe, detectSteps, () => null)

  const install = async () => {
    if (!pending.prompt) return
    const prompt = pending.prompt
    await prompt.prompt()
    await prompt.userChoice
    pending.prompt = undefined
    notify()
  }

  return {
    // Whether to offer installing at all.
    canInstall: !standalone && (canPrompt || steps !== null),
    // No prompt available: show these steps instead.
    steps: canPrompt ? null : steps,
    install,
  }
}
