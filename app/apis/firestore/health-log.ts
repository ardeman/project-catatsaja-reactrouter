import { doc, updateDoc, deleteDoc } from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import { TLiveSubscription } from '~/lib/types/common'
import {
  TCreateHealthLogRequest,
  THealthLogResponse,
  TPinHealthLogRequest,
  THealthLogPermissionRequest,
  TUpdateHealthLogRequest,
} from '~/lib/types/health'

import {
  createShared,
  setSharedPermission,
  subscribeShared,
  subscribeSharedOne,
  unlinkShared,
  updateShared,
} from './shared-document'

export const createHealthLog = (data: TCreateHealthLogRequest) =>
  createShared('healthLogs', data)

export const updateHealthLog = (data: TUpdateHealthLogRequest) => {
  const { id, ...rest } = data
  return updateShared('healthLogs', id, rest)
}

export const pinHealthLog = async (data: TPinHealthLogRequest) => {
  const { healthLog, isPinned } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const pinnedBy = new Set(healthLog.pinnedBy || [])
  if (isPinned) {
    pinnedBy.add(auth.currentUser.uid)
  } else {
    pinnedBy.delete(auth.currentUser.uid)
  }

  const reference = doc(firestore, 'healthLogs', healthLog.id)
  return await updateDoc(reference, {
    pinnedBy: [...pinnedBy],
  })
}

export const deleteHealthLog = async (healthLog: THealthLogResponse) => {
  const { id } = healthLog
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'healthLogs', id)
  await deleteDoc(reference)
  return healthLog
}

export const unlinkHealthLog = (healthLog: THealthLogResponse) =>
  unlinkShared('healthLogs', healthLog)

export const setHealthLogPermission = (form: THealthLogPermissionRequest) =>
  setSharedPermission('healthLogs', form.healthLog, form.uid, form.permission, {
    allowPlain: form.allowPlain,
  })

export const subscribeToHealthLogs: TLiveSubscription<THealthLogResponse[]> = (
  uid,
  onData,
  onError,
) => subscribeShared<THealthLogResponse>('healthLogs', uid, onData, onError)

export const subscribeToHealthLog = (
  id: string,
  uid: string,
  onData: (data: THealthLogResponse | undefined) => void,
  onError: (error: unknown) => void,
) =>
  subscribeSharedOne<THealthLogResponse>('healthLogs', id, uid, onData, onError)
