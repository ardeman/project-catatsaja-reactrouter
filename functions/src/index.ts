import './setup.js'

import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

import { invitationText, TKind, TLang } from './text.js'

// Cloud Functions that send push notifications (invitations, health
// reminders). They never read what an item says: an item's title reaches a
// device only sealed for it by the sender's app.

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
// devices, then deleted. A device whose token stopped working is removed.
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

      const [sender, devices] = await Promise.all([
        database.doc(`users/${message.from}`).get(),
        database.collection(`users/${message.to}/pushTokens`).get(),
      ])
      if (devices.empty) return
      const name = String(sender.get('displayName') ?? '').slice(0, 60)

      const response = await getMessaging().sendEach(
        devices.docs.map((device) => {
          const lang: TLang = device.get('lang') === 'id' ? 'id' : 'en'
          const text = invitationText(lang, message.collection, name)
          const sealed = message.sealed?.[device.id]
          return {
            token: String(device.get('token')),
            data: {
              title: text.title,
              body: text.body,
              ...(sealed && { detailed: text.detailed, sealed }),
              link: pages[message.collection],
              tag: `invitation-${message.item}`,
            },
            webpush: { headers: { Urgency: 'high' } },
          }
        }),
      )

      const gone = devices.docs.filter((_, index) => {
        const code = response.responses[index]?.error?.code
        return code !== undefined && goneCodes.has(code)
      })
      if (gone.length > 0) {
        const batch = database.batch()
        for (const device of gone) {
          batch.delete(device.ref)
          batch.delete(
            database.doc(`users/${message.to}/pushKeys/${device.id}`),
          )
        }
        await batch.commit()
      }
    } finally {
      await snapshot.ref.delete()
    }
  },
)
