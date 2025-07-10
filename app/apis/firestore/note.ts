import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  TCreateNoteRequest,
  TNotePermissionRequest,
  TNoteResponse,
  TPinNoteRequest,
  TUpdateNoteRequest,
} from '~/lib/types/note'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const createNote = async (data: TCreateNoteRequest) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = collection(firestore, 'notes')
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

export const updateNote = async (data: TUpdateNoteRequest) => {
  const { id, ...rest } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'notes', id)
  return await updateDoc(reference, {
    ...rest,
    updatedAt: new Date(),
  })
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
    updatedAt: new Date(),
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

export const unlinkNote = async (note: TNoteResponse) => {
  const { id, permissions } = note
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

  const reference = doc(firestore, 'notes', id)
  return await updateDoc(reference, {
    ...data,
    updatedAt: new Date(),
  })
}

export const setNotePermission = async (form: TNotePermissionRequest) => {
  const { note, uid, permission } = form
  const readPermission = new Set(note.permissions?.read || [])
  const writePermission = new Set(note.permissions?.write || [])
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
  const reference = doc(firestore, 'notes', note.id)
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
