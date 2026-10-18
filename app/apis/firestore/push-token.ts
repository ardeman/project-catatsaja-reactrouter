import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { auth } from '~/lib/configs/firebase'
import { firestore } from '~/lib/configs/firestore'

// The devices that get the person's push notifications
// (`users/{uid}/pushTokens/{id}`): one document per device, named after a
// hash of its push token, so the same device always replaces its own.

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
  await setDoc(
    doc(database, 'users', uid, 'pushTokens', await tokenId(token)),
    {
      token,
      lang,
      updatedAt: serverTimestamp(),
    },
  )
}

export const deletePushToken = async (token: string) => {
  const { database, uid } = requireUser()
  await deleteDoc(
    doc(database, 'users', uid, 'pushTokens', await tokenId(token)),
  )
}
