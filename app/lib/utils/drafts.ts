// What was typed into a form and not saved yet (a new finance entry, Quick
// add), kept in the browser so it comes back when the form opens again:
// after maintenance mode, a reload or leaving the page. Never uploaded: it
// only fills the form in. An encrypted item's draft is kept for this tab
// only (`sessionStorage`), so its readable text doesn't stay on the device;
// sign-out clears them all.

const PREFIX = 'catatsaja-draft:'

const storageFor = (isPrivate: boolean) =>
  isPrivate ? sessionStorage : localStorage

export const readDraft = <T>(key: string): T | undefined => {
  try {
    const raw =
      sessionStorage.getItem(PREFIX + key) ?? localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

export const writeDraft = (key: string, value: unknown, isPrivate: boolean) => {
  try {
    storageFor(isPrivate).setItem(PREFIX + key, JSON.stringify(value))
    // Only one copy, in the right place (an item can become encrypted).
    storageFor(!isPrivate).removeItem(PREFIX + key)
  } catch {
    // Storage blocked or full: the form still works, without a draft.
  }
}

export const clearDraft = (key: string) => {
  try {
    localStorage.removeItem(PREFIX + key)
    sessionStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to clear.
  }
}

export const clearAllDrafts = () => {
  try {
    for (const storage of [localStorage, sessionStorage])
      for (const key of Object.keys(storage))
        if (key.startsWith(PREFIX)) storage.removeItem(key)
  } catch {
    // Nothing to clear.
  }
}
