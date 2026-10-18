import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

import { auth } from '~/lib/configs/firebase'
import { firestore } from '~/lib/configs/firestore'
import { devicePublicKey } from '~/lib/utils/push-device'

// The devices that get the person's push notifications
// (`users/{uid}/pushTokens/{id}`, theirs only): one document per device,
// named after a hash of its push token, so the same device always replaces
// its own. Beside it, under the same id, the device's public key
// (`users/{uid}/pushKeys/{id}`), which anyone signed in can read, to seal
// what a notification says for that device only (`push-seal.ts`).

const requireUser = () => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('No user is currently signed in.')
  return { database: firestore, uid }
}

const tokenId = async (token: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const savePushToken = async (token: string, lang: 'en' | 'id') => {
  const { database, uid } = requireUser()
  const id = await tokenId(token)
  const batch = writeBatch(database)
  batch.set(doc(database, 'users', uid, 'pushTokens', id), {
    token,
    lang,
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(database, 'users', uid, 'pushKeys', id), {
    publicKey: await devicePublicKey(),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
}

export const deletePushToken = async (token: string) => {
  const { database, uid } = requireUser()
  const id = await tokenId(token)
  const batch = writeBatch(database)
  batch.delete(doc(database, 'users', uid, 'pushTokens', id))
  batch.delete(doc(database, 'users', uid, 'pushKeys', id))
  await batch.commit()
}

// The public keys of someone's devices, by device id.
export const fetchPushKeys = async (uid: string) => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  const snapshot = await getDocs(
    collection(firestore, 'users', uid, 'pushKeys'),
  )
  return new Map(
    snapshot.docs.map((key) => [key.id, String(key.data().publicKey)]),
  )
}
