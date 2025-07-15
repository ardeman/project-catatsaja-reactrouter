import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  TCreateTaskRequest,
  TPinTaskRequest,
  TTaskPermissionRequest,
  TTaskResponse,
  TUpdateTaskRequest,
} from '~/lib/types/task'

export const createTask = async (data: TCreateTaskRequest) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = collection(firestore, 'tasks')
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

export const updateTask = async (data: TUpdateTaskRequest) => {
  const { id, ...rest } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'tasks', id)
  return await updateDoc(reference, {
    ...rest,
    updatedAt: new Date(),
  })
}

export const pinTask = async (data: TPinTaskRequest) => {
  const { task, isPinned } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const pinnedBy = new Set(task.pinnedBy || [])
  if (isPinned) {
    pinnedBy.add(auth.currentUser.uid)
  } else {
    pinnedBy.delete(auth.currentUser.uid)
  }

  const reference = doc(firestore, 'tasks', task.id)
  return await updateDoc(reference, {
    pinnedBy: [...pinnedBy],
    updatedAt: new Date(),
  })
}

export const deleteTask = async (task: TTaskResponse) => {
  const { id } = task
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'tasks', id)
  await deleteDoc(reference)
  return task
}

export const unlinkTask = async (task: TTaskResponse) => {
  const { id, permissions } = task
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

  const reference = doc(firestore, 'tasks', id)
  return await updateDoc(reference, {
    ...data,
    updatedAt: new Date(),
  })
}

export const setTaskPermission = async (form: TTaskPermissionRequest) => {
  const { task, uid, permission } = form
  const readPermission = new Set(task.permissions?.read || [])
  const writePermission = new Set(task.permissions?.write || [])
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
  const reference = doc(firestore, 'tasks', task.id)
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
