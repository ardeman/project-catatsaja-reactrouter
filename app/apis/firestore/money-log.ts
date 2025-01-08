import {
  collection,
  FieldPath,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import { TLogResponse, TMoneyLogResponse } from '~/lib/types/money-log'

export const fetchMoneyLogs = async () => {
  if (!firestore) {
    throw new Error('Firebase DB is not initialized')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }

  const queryReference = query(
    collection(firestore, 'money-logs'),
    where(
      new FieldPath('permissions', 'read'),
      'array-contains',
      auth.currentUser.uid,
    ),
  )
  const snap = await getDocs(queryReference)

  return snap.docs.map((document) => {
    const data = document.data()
    return {
      ...data,
      id: document.id,
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

  const queryReference = query(collection(firestore, 'money-logs', id, 'logs'))
  const snap = await getDocs(queryReference)

  return snap.docs.map((document) => {
    const data = document.data()
    return {
      ...data,
      id: document.id,
    } as TLogResponse
  })
}
