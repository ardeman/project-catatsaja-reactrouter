import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  TCreateFinanceRequest,
  TFinanceResponse,
  TPinFinanceRequest,
  TFinancePermissionRequest,
  TUpdateFinanceRequest,
} from '~/lib/types/finance'

export const createFinance = async (data: TCreateFinanceRequest) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = collection(firestore, 'finances')
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

export const updateFinance = async (data: TUpdateFinanceRequest) => {
  const { id, ...rest } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'finances', id)
  return await updateDoc(reference, {
    ...rest,
    updatedAt: new Date(),
  })
}

export const pinFinance = async (data: TPinFinanceRequest) => {
  const { finance, isPinned } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const pinnedBy = new Set(finance.pinnedBy || [])
  if (isPinned) {
    pinnedBy.add(auth.currentUser.uid)
  } else {
    pinnedBy.delete(auth.currentUser.uid)
  }

  const reference = doc(firestore, 'finances', finance.id)
  return await updateDoc(reference, {
    pinnedBy: [...pinnedBy],
    updatedAt: new Date(),
  })
}

export const deleteFinance = async (finance: TFinanceResponse) => {
  const { id } = finance
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'finances', id)
  await deleteDoc(reference)
  return finance
}

export const unlinkFinance = async (finance: TFinanceResponse) => {
  const { id, permissions } = finance
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

  const reference = doc(firestore, 'finances', id)
  return await updateDoc(reference, {
    ...data,
    updatedAt: new Date(),
  })
}

export const setFinancePermission = async (form: TFinancePermissionRequest) => {
  const { finance, uid, permission } = form
  const readPermission = new Set(finance.permissions?.read || [])
  const writePermission = new Set(finance.permissions?.write || [])
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
  const reference = doc(firestore, 'finances', finance.id)
  const data = {
    permissions: {
      read: [...readPermission],
      write: [...writePermission],
    },
  }
  return await updateDoc(reference, {
    ...data,
    updatedAt: new Date(),
  })
}
