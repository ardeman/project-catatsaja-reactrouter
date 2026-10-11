import {
  addDoc,
  collection,
  deleteField,
  doc,
  DocumentData,
  FieldPath,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  canEncrypt,
  contentFields,
  decodeDocument,
  encodeChanges,
  encodeNew,
  encryptExisting,
  forget,
  isEncrypted,
  plainOf,
  rotate,
  sealFor,
  TCollection,
} from '~/lib/utils/encrypted-document'

import { fetchPublicKeys } from './keyring'

// Reading and writing shared items (notes, tasks, finances, health logs),
// encrypted or not: one place, so every collection behaves the same.

type TShared = {
  id: string
  owner?: string
  isEncrypted?: boolean
  permissions?: { read: string[]; write: string[] }
}

const requireUser = () => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('No user is currently signed in.')
  return { database: firestore, uid }
}

// A collection's items that a person can read.
const readableBy = (database: Firestore, name: TCollection, uid: string) =>
  query(
    collection(database, name),
    where(new FieldPath('permissions', 'read'), 'array-contains', uid),
  )

export const createShared = async (
  name: TCollection,
  data: Record<string, unknown>,
) => {
  const { database, uid } = requireUser()
  // Restoring a deleted item passes it back as read: drop what isn't stored.
  const { isEncrypted: _isEncrypted, isPinned: _isPinned, ...stored } = data
  const document = await encodeNew(name, {
    ...stored,
    owner: uid,
    permissions: { read: [uid], write: [uid] },
    createdAt: new Date(),
  })
  return addDoc(collection(database, name), document)
}

export const updateShared = async (
  name: TCollection,
  id: string,
  changes: Record<string, unknown>,
) => {
  const { database } = requireUser()
  const encoded = await encodeChanges(name, id, changes)
  return updateDoc(doc(database, name, id), {
    ...encoded,
    updatedAt: new Date(),
  })
}

// Leaving an item shared with you: off its lists, and your sealed key gone.
export const unlinkShared = async (name: TCollection, item: TShared) => {
  const { database, uid } = requireUser()
  return updateDoc(doc(database, name, item.id), {
    permissions: {
      read: item.permissions?.read.filter((reader) => reader !== uid) ?? [],
      write: item.permissions?.write.filter((writer) => writer !== uid) ?? [],
    },
    ...(item.isEncrypted && { [`keys.${uid}`]: deleteField() }),
  })
}

export class RecipientWithoutEncryption extends Error {
  constructor() {
    super('encryption/recipient-not-set-up')
  }
}

// Sharing, changing access or removing someone. On an encrypted item, a new
// person gets the content key sealed for them (they must have turned
// encryption on, unless `allowPlain` stores the item plain again), and
// removing someone gives the item a new key for the others.
export const setSharedPermission = async (
  name: TCollection,
  item: TShared,
  uid: string,
  permission: 'read' | 'write' | 'delete',
  options: { allowPlain?: boolean } = {},
) => {
  const { database } = requireUser()
  const read = new Set(item.permissions?.read)
  const write = new Set(item.permissions?.write)
  const isNew = !read.has(uid)
  if (permission === 'delete') {
    read.delete(uid)
    write.delete(uid)
  } else {
    read.add(uid)
    if (permission === 'write') write.add(uid)
    else write.delete(uid)
  }
  const permissions = { read: [...read], write: [...write] }
  const reference = doc(database, name, item.id)

  if (!item.isEncrypted) return updateDoc(reference, { permissions })

  if (permission === 'delete') {
    const publicKeys = await fetchPublicKeys(permissions.read)
    for (const [reader, key] of publicKeys) if (!key) publicKeys.delete(reader)
    return updateDoc(reference, {
      permissions,
      ...(await rotate(name, item.id, publicKeys as Map<string, string>)),
    })
  }

  if (!isNew) return updateDoc(reference, { permissions })

  const recipientKeys = await fetchPublicKeys([uid])
  const publicKey = recipientKeys.get(uid)
  if (publicKey)
    return updateDoc(reference, {
      permissions,
      [`keys.${uid}`]: await sealFor(name, item.id, publicKey),
    })

  if (!options.allowPlain) throw new RecipientWithoutEncryption()
  // Shared without encryption: stored plain for everyone from now on.
  const plain = plainOf(name, item.id)
  forget(name, item.id)
  return updateDoc(reference, {
    ...plain,
    permissions,
    encrypted: deleteField(),
    keys: deleteField(),
  })
}

// Live items for a person, decrypted. Decrypting takes a moment, so only
// the newest snapshot is passed on.
export const subscribeShared = <T>(
  name: TCollection,
  uid: string,
  onData: (items: T[]) => void,
  onError: (error: unknown) => void,
) => {
  const { database } = requireUser()
  let latest = 0
  return onSnapshot(
    readableBy(database, name, uid),
    (snap) => {
      const run = ++latest
      void (async () => {
        const items = await Promise.all(
          snap.docs.map(async (document) => {
            const data = await decodeDocument(
              name,
              document.id,
              document.data(),
              uid,
            )
            return data
              ? ({
                  ...data,
                  id: document.id,
                  isPinned: (data.pinnedBy as string[] | undefined)?.includes(
                    uid,
                  ),
                } as T)
              : undefined
          }),
        )
        if (run === latest)
          onData(items.filter((item): item is Awaited<T> => !!item) as T[])
      })()
    },
    onError,
  )
}

export const subscribeSharedOne = <T>(
  name: TCollection,
  id: string,
  uid: string,
  onData: (item: T | undefined) => void,
  onError: (error: unknown) => void,
) => {
  const { database } = requireUser()
  let latest = 0
  return onSnapshot(
    doc(database, name, id),
    (snap) => {
      const run = ++latest
      void (async () => {
        const raw = snap.data()
        const data = raw
          ? await decodeDocument(name, snap.id, raw, uid)
          : undefined
        if (run !== latest) return
        onData(
          data
            ? ({
                ...data,
                id: snap.id,
                isPinned: (data.pinnedBy as string[] | undefined)?.includes(
                  uid,
                ),
              } as T)
            : undefined,
        )
      })()
    },
    onError,
  )
}

// Turning encryption on (and on each unlocked visit after): encrypts the
// person's own plain items that everyone with access can read encrypted.
// The rest wait for those people to turn it on. Doesn't touch `updatedAt`:
// encrypting isn't an edit.
export const encryptOwnItems = async () => {
  const { database, uid } = requireUser()
  if (!canEncrypt()) return { encrypted: 0, waiting: 0 }
  let encrypted = 0
  let waiting = 0
  for (const name of Object.keys(contentFields) as TCollection[]) {
    const snap = await getDocs(readableBy(database, name, uid))
    for (const document of snap.docs) {
      const data = document.data() as DocumentData
      if (data.owner !== uid || isEncrypted(data)) continue
      const readers: string[] = data.permissions?.read ?? [uid]
      const publicKeys = await fetchPublicKeys(readers)
      if (readers.some((reader) => !publicKeys.get(reader))) {
        waiting++
        continue
      }
      const fields = await encryptExisting(
        name,
        document.id,
        data,
        publicKeys as Map<string, string>,
      )
      await updateDoc(document.ref, {
        ...fields,
        ...Object.fromEntries(
          contentFields[name]
            .filter((field) => Object.hasOwn(data, field))
            .map((field) => [field, deleteField()]),
        ),
      })
      encrypted++
    }
  }
  return { encrypted, waiting }
}

// The person's items by kind, as stored (one read per collection).
const storedItems = async () => {
  const { database, uid } = requireUser()
  const items: { name: TCollection; document: QueryDocumentSnapshot }[] = []
  for (const name of Object.keys(contentFields) as TCollection[]) {
    const snap = await getDocs(readableBy(database, name, uid))
    for (const document of snap.docs) items.push({ name, document })
  }
  return { uid, items }
}

// Before turning encryption off: encrypted items others shared with the
// person, which they won't be able to read afterwards.
export const countEncryptedFromOthers = async () => {
  const { uid, items } = await storedItems()
  return items.filter(
    ({ document }) =>
      isEncrypted(document.data()) && document.data().owner !== uid,
  ).length
}

// Turning encryption off: the person's own encrypted items stored plain
// again (everyone they're shared with keeps access). Needs this device
// unlocked. Doesn't touch `updatedAt`: it isn't an edit.
export const decryptOwnItems = async () => {
  const { uid, items } = await storedItems()
  let decrypted = 0
  for (const { name, document } of items) {
    const data = document.data()
    if (data.owner !== uid || !isEncrypted(data)) continue
    const plain = await decodeDocument(name, document.id, data, uid)
    if (!plain) throw new Error('encryption/locked')
    await updateDoc(document.ref, {
      ...Object.fromEntries(
        contentFields[name]
          .filter((field) => Object.hasOwn(plain, field))
          .map((field) => [field, plain[field]]),
      ),
      encrypted: deleteField(),
      keys: deleteField(),
    })
    forget(name, document.id)
    decrypted++
  }
  return decrypted
}

// The owner's encrypted items that someone with access can't read (they
// turned encryption off): found on each visit, stored plain only if the
// owner chooses to.
export const findUnreadableForOthers = async () => {
  const { uid, items } = await storedItems()
  const found: { name: TCollection; id: string; readers: string[] }[] = []
  for (const { name, document } of items) {
    const data = document.data()
    if (data.owner !== uid || !isEncrypted(data)) continue
    const readers: string[] = data.permissions?.read ?? []
    const sealed = Object.keys((data.keys as Record<string, string>) ?? {})
    if (readers.some((reader) => !sealed.includes(reader)))
      found.push({ name, id: document.id, readers })
    else {
      const publicKeys = await fetchPublicKeys(readers)
      if (readers.some((reader) => !publicKeys.get(reader)))
        found.push({ name, id: document.id, readers })
    }
  }
  return found
}

export const shareUnencrypted = async (
  items: { name: TCollection; id: string }[],
) => {
  const { database, uid } = requireUser()
  for (const { name, id } of items) {
    const snapshot = await getDoc(doc(database, name, id))
    const data = snapshot.data()
    if (!data || !isEncrypted(data)) continue
    const plain = await decodeDocument(name, id, data, uid)
    if (!plain) throw new Error('encryption/locked')
    await updateDoc(snapshot.ref, {
      ...Object.fromEntries(
        contentFields[name]
          .filter((field) => Object.hasOwn(plain, field))
          .map((field) => [field, plain[field]]),
      ),
      encrypted: deleteField(),
      keys: deleteField(),
    })
    forget(name, id)
  }
}
