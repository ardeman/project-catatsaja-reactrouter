import {
  onSnapshot,
  query,
  where,
  FieldPath,
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import { TLiveSubscription } from '~/lib/types/common'
import {
  TCreateHealthLogRequest,
  THealthLogResponse,
  TPinHealthLogRequest,
  THealthLogPermissionRequest,
  TUpdateHealthLogRequest,
} from '~/lib/types/health'

export const createHealthLog = async (data: TCreateHealthLogRequest) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = collection(firestore, 'healthLogs')
  return await addDoc(reference, {
    ...data,
    owner: auth.currentUser.uid,
    permissions: {
      read: [auth.currentUser.uid],
      write: [auth.currentUser.uid],
    },
    createdAt: new Date(),
  })
}

export const updateHealthLog = async (data: TUpdateHealthLogRequest) => {
  const { id, ...rest } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'healthLogs', id)
  return await updateDoc(reference, {
    ...rest,
    updatedAt: new Date(),
  })
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

export const unlinkHealthLog = async (healthLog: THealthLogResponse) => {
  const { id, permissions } = healthLog
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const data = {
    permissions: {
      read: permissions?.read.filter((r) => r !== auth?.currentUser?.uid) || [],
      write:
        permissions?.write.filter((w) => w !== auth?.currentUser?.uid) || [],
    },
  }

  const reference = doc(firestore, 'healthLogs', id)
  return await updateDoc(reference, data)
}

export const setHealthLogPermission = async (
  form: THealthLogPermissionRequest,
) => {
  const { healthLog, uid, permission } = form
  const readPermission = new Set(healthLog.permissions?.read || [])
  const writePermission = new Set(healthLog.permissions?.write || [])
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  switch (permission) {
    case 'delete': {
      readPermission.delete(uid)
      writePermission.delete(uid)
      break
    }
    case 'read': {
      readPermission.add(uid)
      writePermission.delete(uid)
      break
    }
    case 'write': {
      readPermission.add(uid)
      writePermission.add(uid)
      break
    }
    default: {
      throw new Error(`Unknown permission: ${permission}`)
    }
  }
  const reference = doc(firestore, 'healthLogs', healthLog.id)
  const data = {
    permissions: {
      read: [...readPermission],
      write: [...writePermission],
    },
  }
  return await updateDoc(reference, data)
}

export const subscribeToHealthLogs: TLiveSubscription<THealthLogResponse[]> = (
  uid,
  onData,
  onError,
) => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  const reference = query(
    collection(firestore, 'healthLogs'),
    where(new FieldPath('permissions', 'read'), 'array-contains', uid),
  )
  return onSnapshot(
    reference,
    (snap) => {
      onData(
        snap.docs.map((document) => {
          const data = document.data()
          return {
            ...data,
            id: document.id,
            isPinned: data.pinnedBy?.includes(uid),
          } as THealthLogResponse
        }),
      )
    },
    onError,
  )
}

export const subscribeToHealthLog = (
  id: string,
  uid: string,
  onData: (data: THealthLogResponse | undefined) => void,
  onError: (error: unknown) => void,
) => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  return onSnapshot(
    doc(firestore, 'healthLogs', id),
    (snap) => {
      const data = snap.data()
      onData(
        data
          ? ({
              ...data,
              id: snap.id,
              isPinned: data.pinnedBy?.includes(uid),
            } as THealthLogResponse)
          : undefined,
      )
    },
    onError,
  )
}
