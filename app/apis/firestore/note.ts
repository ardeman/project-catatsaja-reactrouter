import { doc, updateDoc, deleteDoc } from 'firebase/firestore'

import { auth } from '~/lib/configs/firebase'
import { firestore } from '~/lib/configs/firestore'
import { TLiveSubscription } from '~/lib/types/common'
import {
  TCreateNoteRequest,
  TNotePermissionRequest,
  TNoteResponse,
  TPinNoteRequest,
  TUpdateNoteRequest,
} from '~/lib/types/note'

import {
  createShared,
  setSharedPermission,
  subscribeShared,
  subscribeSharedOne,
  unlinkShared,
  updateShared,
} from './shared-document'

export const createNote = (data: TCreateNoteRequest) =>
  createShared('notes', data)

export const updateNote = (data: TUpdateNoteRequest) => {
  const { id, ...rest } = data
  return updateShared('notes', id, rest)
}

export const pinNote = async (data: TPinNoteRequest) => {
  const { note, isPinned } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const pinnedBy = new Set(note.pinnedBy || [])
  if (isPinned) {
    pinnedBy.add(auth.currentUser.uid)
  } else {
    pinnedBy.delete(auth.currentUser.uid)
  }

  const reference = doc(firestore, 'notes', note.id)
  return await updateDoc(reference, {
    pinnedBy: [...pinnedBy],
  })
}

export const deleteNote = async (note: TNoteResponse) => {
  const { id } = note
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'notes', id)
  await deleteDoc(reference)
  return note
}

export const unlinkNote = (note: TNoteResponse) => unlinkShared('notes', note)

export const setNotePermission = (form: TNotePermissionRequest) =>
  setSharedPermission('notes', form.note, form.uid, form.permission, {
    allowPlain: form.allowPlain,
  })

export const subscribeToNotes: TLiveSubscription<TNoteResponse[]> = (
  uid,
  onData,
  onError,
) => subscribeShared<TNoteResponse>('notes', uid, onData, onError)

export const subscribeToNote = (
  id: string,
  uid: string,
  onData: (data: TNoteResponse | undefined) => void,
  onError: (error: unknown) => void,
) => subscribeSharedOne<TNoteResponse>('notes', id, uid, onData, onError)
