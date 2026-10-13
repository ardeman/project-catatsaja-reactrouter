import {
  addDoc,
  arrayRemove,
  arrayUnion,
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

import { auth } from '~/lib/configs/firebase'
import { firestore } from '~/lib/configs/firestore'
import { TInvitation } from '~/lib/types/common'
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
  // Invited and not accepted yet.
  invites?: { read: string[]; write: string[] }
}

// Everyone who holds (or is to hold) an item's key: the people with access
// and the people invited to it.
const audienceOf = (data: DocumentData | TShared): string[] => [
  ...new Set<string>([
    ...(data.permissions?.read ?? []),
    ...(data.invites?.read ?? []),
  ]),
]

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

// A collection's items a person is invited to and hasn't accepted yet.
const invitedTo = (database: Firestore, name: TCollection, uid: string) =>
  query(
    collection(database, name),
    where(new FieldPath('invites', 'read'), 'array-contains', uid),
  )

export const createShared = async (
  name: TCollection,
  data: Record<string, unknown>,
) => {
  const { database, uid } = requireUser()
  // Restoring a deleted item passes it back as read: drop what isn't stored,
  // and its invitations (a new item starts unshared).
  const {
    isEncrypted: _isEncrypted,
    isPinned: _isPinned,
    isArchived: _isArchived,
    invites: _invites,
    ...stored
  } = data
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

// The person can't be invited by this owner (they blocked them). Said
// neutrally in the app: nobody learns that they were blocked.
export class InviteRefused extends Error {
  constructor() {
    super('share/invite-refused')
  }
}

const isPermissionDenied = (error: unknown) =>
  (error as { code?: string } | undefined)?.code === 'permission-denied'

// Sharing, changing access or removing someone. Someone new is invited
// (`invites`) and gets access only once they accept; people who already
// have access, or an invitation, just change role. On an encrypted item an
// invited person gets the content key sealed for them, so the invitation
// can show the title (they must have turned encryption on, unless
// `allowPlain` stores the item plain again), and removing someone or
// cancelling an invitation gives the item a new key for the others.
const writeSharedPermission = async (
  name: TCollection,
  item: TShared,
  uid: string,
  permission: 'read' | 'write' | 'delete',
  options: { allowPlain?: boolean } = {},
) => {
  const { database } = requireUser()
  const read = new Set(item.permissions?.read)
  const write = new Set(item.permissions?.write)
  const invitedRead = new Set(item.invites?.read)
  const invitedWrite = new Set(item.invites?.write)
  const isNew = !read.has(uid) && !invitedRead.has(uid)
  if (permission === 'delete') {
    for (const list of [read, write, invitedRead, invitedWrite])
      list.delete(uid)
  } else if (read.has(uid)) {
    if (permission === 'write') write.add(uid)
    else write.delete(uid)
  } else {
    invitedRead.add(uid)
    if (permission === 'write') invitedWrite.add(uid)
    else invitedWrite.delete(uid)
  }
  const access = {
    permissions: { read: [...read], write: [...write] },
    invites: { read: [...invitedRead], write: [...invitedWrite] },
  }
  const reference = doc(database, name, item.id)

  if (!item.isEncrypted) return updateDoc(reference, access)

  if (permission === 'delete') {
    const publicKeys = await fetchPublicKeys(audienceOf(access))
    for (const [reader, key] of publicKeys) if (!key) publicKeys.delete(reader)
    return updateDoc(reference, {
      ...access,
      ...(await rotate(name, item.id, publicKeys as Map<string, string>)),
    })
  }

  if (!isNew) return updateDoc(reference, access)

  const recipientKeys = await fetchPublicKeys([uid])
  const publicKey = recipientKeys.get(uid)
  if (publicKey)
    return updateDoc(reference, {
      ...access,
      [`keys.${uid}`]: await sealFor(name, item.id, publicKey),
    })

  if (!options.allowPlain) throw new RecipientWithoutEncryption()
  // Shared without encryption: stored plain for everyone from now on.
  const plain = plainOf(name, item.id)
  forget(name, item.id)
  return updateDoc(reference, {
    ...plain,
    ...access,
    encrypted: deleteField(),
    keys: deleteField(),
  })
}

// Archiving or bringing back an item for the person only: it leaves their
// main list, not anyone else's. Doesn't touch `updatedAt`: it isn't an edit.
export const setArchived = async (
  name: TCollection,
  id: string,
  isArchived: boolean,
) => {
  const { database, uid } = requireUser()
  return updateDoc(doc(database, name, id), {
    archivedBy: isArchived ? arrayUnion(uid) : arrayRemove(uid),
  })
}

export const setSharedPermission = async (
  ...parameters: Parameters<typeof writeSharedPermission>
) => {
  const [, item, uid] = parameters
  const isNew =
    !item.permissions?.read.includes(uid) && !item.invites?.read.includes(uid)
  try {
    return await writeSharedPermission(...parameters)
  } catch (error: unknown) {
    // The rules refuse an invitation to someone who blocked the owner.
    if (isNew && isPermissionDenied(error)) throw new InviteRefused()
    throw error
  }
}

// Accepting an invitation: the access offered (and nothing more), and the
// invitation gone. Doesn't touch `updatedAt`: it isn't an edit.
export const acceptInvite = async (
  name: TCollection,
  id: string,
  access: 'read' | 'write',
) => {
  const { database, uid } = requireUser()
  return updateDoc(doc(database, name, id), {
    'permissions.read': arrayUnion(uid),
    ...(access === 'write' && { 'permissions.write': arrayUnion(uid) }),
    'invites.read': arrayRemove(uid),
    'invites.write': arrayRemove(uid),
  })
}

// Declining: the invitation and the key sealed for it are gone.
export const declineInvite = async (
  name: TCollection,
  id: string,
  isEncrypted: boolean,
) => {
  const { database, uid } = requireUser()
  return updateDoc(doc(database, name, id), {
    'invites.read': arrayRemove(uid),
    'invites.write': arrayRemove(uid),
    ...(isEncrypted && { [`keys.${uid}`]: deleteField() }),
  })
}

const toInvitation = async (
  name: TCollection,
  document: QueryDocumentSnapshot,
  uid: string,
) => {
  const raw = document.data()
  const data = await decodeDocument(name, document.id, raw, uid)
  const title = data?.title ?? data?.name
  return {
    name,
    id: document.id,
    owner: String(raw.owner ?? ''),
    title: typeof title === 'string' ? title : '',
    access: (raw.invites?.write ?? []).includes(uid) ? 'write' : 'read',
    isEncrypted: isEncrypted(raw),
    createdAt: raw.createdAt?.seconds ?? 0,
  } as TInvitation & { createdAt: number }
}

// Invitations waiting for the person, of every kind, newest first: live, so
// a new one shows up at once.
export const subscribeToInvitations = (
  uid: string,
  onData: (invitations: TInvitation[]) => void,
  onError: (error: unknown) => void,
) => {
  const { database } = requireUser()
  const names = Object.keys(contentFields) as TCollection[]
  const byName = new Map<TCollection, TInvitation[]>()
  const latest = new Map<TCollection, number>()
  const send = () => {
    if (byName.size < names.length) return
    onData(names.flatMap((name) => byName.get(name) ?? []))
  }
  const listen = (name: TCollection) =>
    onSnapshot(
      invitedTo(database, name, uid),
      (snap) => {
        const run = (latest.get(name) ?? 0) + 1
        latest.set(name, run)
        void (async () => {
          const invitations = await Promise.all(
            snap.docs.map((document) => toInvitation(name, document, uid)),
          )
          if (latest.get(name) !== run) return
          byName.set(
            name,
            invitations
              .toSorted((a, b) => b.createdAt - a.createdAt)
              .map(({ createdAt: _createdAt, ...invitation }) => invitation),
          )
          send()
        })()
      },
      onError,
    )
  const unsubscribes = names.map((name) => listen(name))
  return () => {
    for (const unsubscribe of unsubscribes) unsubscribe()
  }
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
                  isArchived: (
                    data.archivedBy as string[] | undefined
                  )?.includes(uid),
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
                isArchived: (data.archivedBy as string[] | undefined)?.includes(
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
      const readers = audienceOf(data)
      if (readers.length === 0) readers.push(uid)
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

// The people on the person's items (owners, everyone they are shared with
// or invited to them), from the most recently changed item: suggestions
// when sharing.
export const fetchContactIds = async () => {
  const { uid, items } = await storedItems()
  const changedAt = (data: DocumentData) =>
    (data.updatedAt ?? data.createdAt)?.seconds ?? 0
  const ids = items
    .map(({ document }) => document.data())
    .toSorted((a, b) => changedAt(b) - changedAt(a))
    .flatMap((data) => [data.owner, ...audienceOf(data)])
    .filter((id): id is string => typeof id === 'string' && id !== uid)
  return [...new Set(ids)]
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
    const readers = audienceOf(data)
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
