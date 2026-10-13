import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import { TLiveSubscription } from '~/lib/types/common'

// The people the person blocked, in their own private list
// (`users/{uid}/blocked/{id}`): the rules refuse invitations from them.

const requireUser = () => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('No user is currently signed in.')
  return { database: firestore, uid }
}

export const blockUser = async (blockedId: string) => {
  const { database, uid } = requireUser()
  await setDoc(doc(database, 'users', uid, 'blocked', blockedId), {
    blockedAt: new Date(),
  })
}

export const unblockUser = async (blockedId: string) => {
  const { database, uid } = requireUser()
  await deleteDoc(doc(database, 'users', uid, 'blocked', blockedId))
}

// Their ids, live.
export const subscribeToBlocked: TLiveSubscription<string[]> = (
  uid,
  onData,
  onError,
) => {
  const { database } = requireUser()
  return onSnapshot(
    collection(database, 'users', uid, 'blocked'),
    (snap) => onData(snap.docs.map((document) => document.id)),
    onError,
  )
}
