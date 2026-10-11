import { doc, updateDoc, deleteDoc } from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import { TLiveSubscription } from '~/lib/types/common'
import {
  TCreateTaskRequest,
  TPinTaskRequest,
  TTaskPermissionRequest,
  TTaskResponse,
  TUpdateTaskRequest,
} from '~/lib/types/task'

import {
  createShared,
  setSharedPermission,
  subscribeShared,
  subscribeSharedOne,
  unlinkShared,
  updateShared,
} from './shared-document'

export const createTask = (data: TCreateTaskRequest) =>
  createShared('tasks', data)

export const updateTask = (data: TUpdateTaskRequest) => {
  const { id, ...rest } = data
  return updateShared('tasks', id, rest)
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

export const unlinkTask = (task: TTaskResponse) => unlinkShared('tasks', task)

export const setTaskPermission = (form: TTaskPermissionRequest) =>
  setSharedPermission('tasks', form.task, form.uid, form.permission, {
    allowPlain: form.allowPlain,
  })

export const subscribeToTasks: TLiveSubscription<TTaskResponse[]> = (
  uid,
  onData,
  onError,
) => subscribeShared<TTaskResponse>('tasks', uid, onData, onError)

export const subscribeToTask = (
  id: string,
  uid: string,
  onData: (data: TTaskResponse | undefined) => void,
  onError: (error: unknown) => void,
) => subscribeSharedOne<TTaskResponse>('tasks', id, uid, onData, onError)
