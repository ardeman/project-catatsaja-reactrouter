import {
  collection,
  FieldPath,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs'
import { TLogResponse, TMoneyLogResponse } from '~/lib/types'

export const fetchMoneyLogs = async () => {
  if (!firestore) {
    throw new Error('Firebase DB is not initialized')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }

  const queryRef = query(
    collection(firestore, 'money-logs'),
    where(
      new FieldPath('permissions', 'read'),
      'array-contains',
      auth.currentUser.uid,
    ),
  )
  const snap = await getDocs(queryRef)

  return snap.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      isPinned: data.pinnedBy?.includes(auth?.currentUser?.uid),
    } as TMoneyLogResponse
  })
}

export const fetchLogs = async (id: string) => {
  if (!firestore) {
    throw new Error('Firebase DB is not initialized')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }

  const queryRef = query(collection(firestore, 'money-logs', id, 'logs'))
  const snap = await getDocs(queryRef)

  return snap.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
    } as TLogResponse
  })
}
