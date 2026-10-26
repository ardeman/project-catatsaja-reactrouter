import {
  collection,
  doc,
  getDocsFromServer,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'

import { fetchPushKeys, TPushKey } from '~/apis/firestore/push-token'
import { auth } from '~/lib/configs/firebase'
import { firestore } from '~/lib/configs/firestore'
import { THealthLogResponse } from '~/lib/types/health'
import { sealForDevice } from '~/lib/utils/push-seal'

// When a health log's reminders and medicine doses are pushed
// (`healthLogs/{id}/pushSchedule/{reminderId}`, sent by a Cloud Function):
// one document per reminder or medicine, with its upcoming times and its
// text sealed for each device of everyone with access (or only the owner's,
// `ownerOnly`), in that device's language. The server sees only the times,
// whether it is a medicine and whether it is for the owner only.

export type TPushReminder = {
  // The reminder's or the medicine's id.
  id: string
  kind: 'medicine' | 'reminder'
  // Milliseconds, soonest first, all still to come.
  times: number[]
  text: Record<TPushKey['lang'], string>
  // Sent to the log's owner only, not everyone with access.
  ownerOnly?: boolean
}

// As many as the rules allow.
const MAX_TIMES = 64
const MAX_DEVICES = 50

// What this browser last wrote for each schedule (a hash of its text), so
// it is rewritten only when something changed, not on every start.
const writtenStorageKey = 'push-schedule'

const readWritten = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(writtenStorageKey) ?? '{}')
  } catch {
    return {}
  }
}

const saveWritten = (written: Record<string, string>) => {
  try {
    localStorage.setItem(writtenStorageKey, JSON.stringify(written))
  } catch {
    // Storage blocked: the schedules are rewritten on the next start.
  }
}

const hashOf = async (text: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item, index) => item === b[index])

// Brings a log's schedules in line with its reminders: new and changed ones
// written, ones with nothing to come (or nobody with push) removed. Reads
// from the server only, so offline it throws rather than work from an old
// copy.
export const syncPushSchedule = async (
  log: Pick<THealthLogResponse, 'id' | 'owner' | 'permissions'>,
  reminders: TPushReminder[],
) => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  if (!auth?.currentUser) throw new Error('No user is currently signed in.')
  const database = firestore
  const reference = collection(database, 'healthLogs', log.id, 'pushSchedule')
  const stored = await getDocsFromServer(reference)
  const due = reminders.filter((reminder) => reminder.times.length > 0)
  if (stored.empty && due.length === 0) return

  const devices = new Map<string, TPushKey & { uid: string }>()
  if (due.length > 0) {
    const people = new Set([log.owner, ...(log.permissions?.read ?? [])])
    for (const uid of people) {
      const keys = await fetchPushKeys(uid)
      for (const [id, key] of keys)
        if (devices.size < MAX_DEVICES) devices.set(id, { ...key, uid })
    }
  }
  const devicesFor = (reminder: TPushReminder) =>
    [...devices].filter(
      ([, { uid }]) => !reminder.ownerOnly || uid === log.owner,
    )
  const wanted = due.filter((reminder) => devicesFor(reminder).length > 0)
  const written = readWritten()
  const now = Date.now()
  const batch = writeBatch(database)
  let changes = 0

  for (const document of stored.docs)
    if (wanted.every((reminder) => reminder.id !== document.id)) {
      batch.delete(document.ref)
      delete written[`${log.id}/${document.id}`]
      changes++
    }

  for (const reminder of wanted) {
    const key = `${log.id}/${reminder.id}`
    const times = reminder.times.slice(0, MAX_TIMES)
    const targets = devicesFor(reminder)
    const deviceIds = targets
      .map(([id]) => id)
      .toSorted((a, b) => a.localeCompare(b))
    const hash = await hashOf(
      JSON.stringify([reminder.kind, reminder.text, !!reminder.ownerOnly]),
    )
    const current = stored.docs.find((item) => item.id === reminder.id)?.data()
    const storedTimes = ((current?.times ?? []) as Timestamp[])
      .map((time) => time.toMillis())
      .filter((time) => time > now)
    if (
      current &&
      written[key] === hash &&
      sameList(storedTimes.map(String), times.map(String)) &&
      sameList(
        Object.keys(current.sealed ?? {}).toSorted((a, b) =>
          a.localeCompare(b),
        ),
        deviceIds,
      )
    )
      continue

    const sealed: Record<string, string> = {}
    for (const [id, { publicKey, lang }] of targets)
      try {
        sealed[id] = await sealForDevice(reminder.text[lang], publicKey)
      } catch {
        // A key that isn't one: that device gets the plain text.
      }
    batch.set(doc(reference, reminder.id), {
      kind: reminder.kind,
      ...(reminder.ownerOnly && { ownerOnly: true }),
      times: times.map((time) => Timestamp.fromMillis(time)),
      next: Timestamp.fromMillis(times[0]),
      sealed,
      updatedAt: serverTimestamp(),
    })
    written[key] = hash
    changes++
  }

  if (changes === 0) return
  await batch.commit()
  saveWritten(written)
}
