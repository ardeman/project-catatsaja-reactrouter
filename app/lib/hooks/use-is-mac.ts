import { useSyncExternalStore } from 'react'

const noSubscribe = () => () => {}
const isMacSnapshot = () => /mac|iphone|ipad/i.test(navigator.userAgent)

// Whether shortcuts use ⌘ rather than Ctrl. Pages rendered at build time show
// Ctrl until hydrated.
export const useIsMac = () =>
  useSyncExternalStore(noSubscribe, isMacSnapshot, () => false)
