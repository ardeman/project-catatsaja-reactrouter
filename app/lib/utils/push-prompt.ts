// Whether this device was already asked about push notifications (and the
// person chose "Not now"). Push is set up per device, so the answer is kept
// in this browser, not on the profile; Settings → General stays the way back.

const storageKey = 'push-prompt-dismissed'

export const isPushPromptDismissed = () => {
  try {
    return localStorage.getItem(storageKey) === '1'
  } catch {
    return false
  }
}

export const dismissPushPrompt = () => {
  try {
    localStorage.setItem(storageKey, '1')
  } catch {
    // Storage blocked: asked again next visit.
  }
}
