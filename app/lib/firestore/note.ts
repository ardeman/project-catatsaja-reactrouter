import {
  addDoc,
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  where,
  deleteDoc,
  FieldPath,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs'
import {
  TCreateNoteRequest,
  TNoteResponse,
  TPinNoteRequest,
  TUpdateNoteRequest,
} from '~/lib/types'

export const fetchNotes = async () => {
  if (!firestore) {
    throw new Error('Firebase DB is not initialized')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }

  const notesQuery = query(
    collection(firestore, 'notes'),
    where(
      new FieldPath('permissions', 'read'),
      'array-contains',
      auth.currentUser.uid,
    ),
  )
  const snap = await getDocs(notesQuery)

  // Map over the snapshot documents, including both data and ID
  return snap.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id, // Get document ID
      isPinned: data.pinnedBy?.includes(auth?.currentUser?.uid),
    } as TNoteResponse
  })
}

export const createNote = async (data: TCreateNoteRequest) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const ref = collection(firestore, 'notes')
  return await addDoc(ref, {
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
  const ref = doc(firestore, 'notes', id)
  return await updateDoc(ref, {
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

  const ref = doc(firestore, 'notes', note.id)
  return await updateDoc(ref, {
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
  const ref = doc(firestore, 'notes', id)
  await deleteDoc(ref)
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

  const ref = doc(firestore, 'notes', id)
  return await updateDoc(ref, {
    ...data,
    updatedAt: new Date(),
  })
}
