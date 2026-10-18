// How many of the person's encrypted items someone they share with can't
// read, as last checked on this device. Checking reads every item, so the
// notifications check at most once a day; Settings → Account checks on
// every visit and keeps this up to date. Only the count is kept.

const PREFIX = 'unreadable-check:'
const DAY = 24 * 60 * 60 * 1000

type TCheck = { at: number; count: number }

const listeners = new Set<() => void>()
const cache = new Map<string, TCheck | undefined>()

const read = (uid: string): TCheck | undefined => {
  if (cache.has(uid)) return cache.get(uid)
  let check: TCheck | undefined
  try {
    const stored = JSON.parse(
      localStorage.getItem(PREFIX + uid) ?? 'null',
    ) as TCheck | null
    if (typeof stored?.at === 'number' && typeof stored.count === 'number')
      check = stored
  } catch {
    check = undefined
  }
  cache.set(uid, check)
  return check
}

export const getUnreadableCount = (uid: string) => read(uid)?.count ?? 0

export const isUnreadableCheckDue = (uid: string) =>
  Date.now() - (read(uid)?.at ?? 0) > DAY

export const setUnreadableCount = (uid: string, count: number) => {
  const check = { at: Date.now(), count }
  cache.set(uid, check)
  try {
    localStorage.setItem(PREFIX + uid, JSON.stringify(check))
  } catch {
    // Kept for this tab only.
  }
  for (const listener of listeners) listener()
}

export const subscribeToUnreadableCount = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
