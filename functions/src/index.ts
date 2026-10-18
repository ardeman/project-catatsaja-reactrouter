import './setup.js'

import {
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { logger } from 'firebase-functions'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import { invitationText, reminderText, TKind, TLang } from './text.js'

// Cloud Functions that send push notifications (invitations, health
// reminders). They never read what an item says: an item's title or a
// medicine's name reaches a device only sealed for it by the sender's app.

const pages: Record<TKind, string> = {
  notes: '/notes',
  tasks: '/tasks',
  finances: '/finances',
  healthLogs: '/health',
}

// Tokens Cloud Messaging no longer knows: the device was reset, the app
// uninstalled or the permission taken back.
const goneCodes = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
])

type TText = { title: string; body: string; detailed: string }

// One notification to each device of these people, in its language, with
// the text sealed for that device when there is one. A device whose token
// stopped working is removed.
const sendToDevices = async ({
  people,
  text,
  sealed,
  link,
  tag,
  ttl,
}: {
  people: string[]
  text: (lang: TLang) => TText
  sealed: Record<string, string>
  link: string
  tag: string
  // Seconds Cloud Messaging keeps trying a device that is off.
  ttl?: number
}) => {
  const database = getFirestore()
  const tokens = await Promise.all(
    people.map(async (uid) => {
      const snapshot = await database
        .collection(`users/${uid}/pushTokens`)
        .get()
      return snapshot.docs.map((device) => ({ uid, device }))
    }),
  )
  const devices = tokens.flat()
  if (devices.length === 0) return

  const response = await getMessaging().sendEach(
    devices.map(({ device }) => {
      const words = text(device.get('lang') === 'id' ? 'id' : 'en')
      const sealedText = sealed[device.id]
      return {
        token: String(device.get('token')),
        data: {
          title: words.title,
          body: words.body,
          ...(sealedText && { detailed: words.detailed, sealed: sealedText }),
          link,
          tag,
        },
        webpush: {
          headers: {
            Urgency: 'high',
            ...(ttl !== undefined && { TTL: String(ttl) }),
          },
        },
      }
    }),
  )

  const gone = devices.filter((_, index) => {
    const code = response.responses[index]?.error?.code
    return code !== undefined && goneCodes.has(code)
  })
  if (gone.length === 0) return
  const batch = database.batch()
  for (const { uid, device } of gone) {
    batch.delete(device.ref)
    batch.delete(database.doc(`users/${uid}/pushKeys/${device.id}`))
  }
  await batch.commit()
}

type TMessage = {
  kind: 'invitation'
  to: string
  from: string
  collection: TKind
  item: string
  sealed: Record<string, string>
}

// An invitation's notification (`pushMessages`, written with the
// invitation; see firestore.rules), to each of the invited person's
// devices, then deleted.
export const sendInvitationPush = onDocumentCreated(
  'pushMessages/{messageId}',
  async (event) => {
    const snapshot = event.data
    if (!snapshot) return
    const message = snapshot.data() as TMessage
    const database = getFirestore()
    try {
      // Cancelled before it went out: nothing to say.
      const item = await database
        .doc(`${message.collection}/${message.item}`)
        .get()
      const invited: string[] = item.get('invites.read') ?? []
      if (!invited.includes(message.to)) return

      const sender = await database.doc(`users/${message.from}`).get()
      const name = String(sender.get('displayName') ?? '').slice(0, 60)
      await sendToDevices({
        people: [message.to],
        text: (lang) => invitationText(lang, message.collection, name),
        sealed: message.sealed ?? {},
        link: pages[message.collection],
        tag: `invitation-${message.item}`,
      })
    } finally {
      await snapshot.ref.delete()
    }
  },
)

// A time this long past still goes out (the function runs every few
// minutes and may start late); older ones were missed and stay in the app.
const LATE_MS = 15 * 60_000

// A reminder's or a medicine's notification, to everyone with access to
// the log, when one of its times has come (`pushSchedule`, kept by the app;
// see firestore.rules). Times that have passed are taken off, and the
// schedule is deleted once none are left or the log is gone.
const sendReminder = async (schedule: QueryDocumentSnapshot, now: number) => {
  const logReference = schedule.ref.parent.parent
  const log = logReference ? await logReference.get() : undefined
  // Rewritten by the app since it was read: its times are its own.
  const unchanged = { lastUpdateTime: schedule.updateTime }
  if (!log?.exists) {
    await schedule.ref.delete(unchanged)
    return
  }

  const times = ((schedule.get('times') ?? []) as Timestamp[]).map((time) =>
    time.toMillis(),
  )
  const left = times.filter((time) => time > now).toSorted((a, b) => a - b)
  try {
    if (left.length > 0)
      await schedule.ref.update(
        {
          times: left.map((time) => Timestamp.fromMillis(time)),
          next: Timestamp.fromMillis(left[0]),
        },
        unchanged,
      )
    else await schedule.ref.delete(unchanged)
  } catch {
    // Changed meanwhile: what the app wrote stands, and nothing is sent
    // twice.
    return
  }

  if (times.every((time) => time > now || time <= now - LATE_MS)) return
  const kind = schedule.get('kind') === 'medicine' ? 'medicine' : 'reminder'
  const people = [
    ...new Set<string>([
      log.get('owner'),
      ...(log.get('permissions.read') ?? []),
    ]),
  ].filter((uid) => typeof uid === 'string')
  await sendToDevices({
    people,
    text: (lang) => reminderText(lang, kind),
    sealed: schedule.get('sealed') ?? {},
    link: `${pages.healthLogs}/${log.id}`,
    tag: `reminder-${schedule.id}`,
    // A dose an hour late is no longer worth a notification.
    ttl: 3600,
  })
}

export const sendReminderPushes = onSchedule('every 5 minutes', async () => {
  const now = Date.now()
  const due = await getFirestore()
    .collectionGroup('pushSchedule')
    .where('next', '<=', Timestamp.fromMillis(now))
    .limit(500)
    .get()
  await Promise.all(
    due.docs.map(async (schedule) => {
      try {
        await sendReminder(schedule, now)
      } catch (error) {
        logger.error('Reminder push failed', schedule.ref.path, error)
      }
    }),
  )
})
