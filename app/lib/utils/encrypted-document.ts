import {
  decryptJson,
  encryptJson,
  generateContentKey,
  importPublicKey,
  TEncrypted,
  unwrapContentKey,
  wrapContentKey,
} from './crypto'
import {
  contentKeys,
  decrypted,
  getPrivateKey,
  getPublicKey,
  plainContent,
} from './encryption-session'

// Shared items, encrypted or not. An encrypted item keeps what the rules
// and lists need readable (owner, permissions, pins, dates) and stores its
// content fields as one AES-GCM blob (`encrypted`), with its content key
// sealed for each person who has access (`keys`). Plain items are unchanged,
// so people who haven't turned encryption on work as before.

export const contentFields = {
  notes: ['title', 'content'],
  tasks: ['title', 'content'],
  finances: ['title', 'content', 'currency', 'accounts', 'summary'],
  healthLogs: [
    'name',
    'birthDate',
    'sex',
    'calorieTarget',
    'content',
    'reminders',
  ],
} as const

export type TCollection = keyof typeof contentFields

type TData = Record<string, unknown>

export type TEncryptedFields = {
  encrypted: TEncrypted
  keys: Record<string, string>
}

const cacheKey = (collection: TCollection, id: string) => `${collection}/${id}`

const pick = (collection: TCollection, data: TData) =>
  Object.fromEntries(
    contentFields[collection]
      .filter((field) => Object.hasOwn(data, field))
      .map((field) => [field, data[field]]),
  )

const omit = (collection: TCollection, data: TData) =>
  Object.fromEntries(
    Object.entries(data).filter(
      ([field]) =>
        !(contentFields[collection] as readonly string[]).includes(field),
    ),
  )

export const isEncrypted = (data: TData | undefined) => !!data?.encrypted

// Whether new items are encrypted: the person turned it on and this device
// is unlocked.
export const canEncrypt = () => !!getPrivateKey() && !!getPublicKey()

// A stored item as the app uses it: decrypted when encrypted. Undefined when
// it can't be read (locked, or no key for this person), so it is left out
// rather than shown empty.
export const decodeDocument = async (
  collection: TCollection,
  id: string,
  data: TData,
  uid: string,
): Promise<TData | undefined> => {
  if (!isEncrypted(data)) return data
  const privateKey = getPrivateKey()
  const wrapped = (data.keys as Record<string, string> | undefined)?.[uid]
  if (!privateKey || !wrapped) return
  const key = cacheKey(collection, id)
  const encrypted = data.encrypted as TEncrypted
  try {
    const cached = decrypted.get(key)
    const isUnchanged =
      cached?.iv === encrypted.iv && cached.wrapped === wrapped
    const contentKey = isUnchanged
      ? cached.contentKey
      : await unwrapContentKey(wrapped, privateKey)
    const plain = isUnchanged
      ? cached.plain
      : await decryptJson<TData>(encrypted, contentKey)
    decrypted.set(key, { iv: encrypted.iv, wrapped, contentKey, plain })
    contentKeys.set(key, contentKey)
    plainContent.set(key, plain)
    const { encrypted: _encrypted, keys: _keys, ...rest } = data
    return { ...omit(collection, rest), ...plain, isEncrypted: true }
  } catch {
    return
  }
}

// A new item: encrypted for its creator when they use encryption.
export const encodeNew = async (collection: TCollection, data: TData) => {
  const uid = data.owner as string
  const ownPublicKey = getPublicKey()
  if (!ownPublicKey || !canEncrypt()) return data
  const contentKey = await generateContentKey()
  const encrypted = await encryptJson(pick(collection, data), contentKey)
  const sealed = await wrapContentKey(
    contentKey,
    await importPublicKey(ownPublicKey),
  )
  return {
    ...omit(collection, data),
    encrypted,
    keys: { [uid]: sealed },
  }
}

// Changes to an item: for an encrypted one, its whole content encrypted
// again with the changes in (the blob is one field). Fails rather than
// writing anything partial when the item isn't decrypted here.
export const encodeChanges = async (
  collection: TCollection,
  id: string,
  changes: TData,
) => {
  const key = cacheKey(collection, id)
  const contentKey = contentKeys.get(key)
  if (!contentKey) return changes
  const plain = plainContent.get(key)
  if (!plain) throw new Error('encryption/locked')
  const contentChanges = pick(collection, changes)
  if (Object.keys(contentChanges).length === 0) return changes
  const next = { ...plain, ...contentChanges }
  const encrypted = await encryptJson(next, contentKey)
  plainContent.set(key, next)
  return { ...omit(collection, changes), encrypted }
}

// The item's content key sealed for one more person (sharing).
export const sealFor = async (
  collection: TCollection,
  id: string,
  publicKey: string,
) => {
  const contentKey = contentKeys.get(cacheKey(collection, id))
  if (!contentKey) throw new Error('encryption/locked')
  return wrapContentKey(contentKey, await importPublicKey(publicKey))
}

// A new content key for the people who keep access (after removing
// someone, so they can't read later changes).
export const rotate = async (
  collection: TCollection,
  id: string,
  publicKeys: Map<string, string>,
): Promise<TEncryptedFields> => {
  const key = cacheKey(collection, id)
  const plain = plainContent.get(key)
  if (!plain) throw new Error('encryption/locked')
  const contentKey = await generateContentKey()
  const encrypted = await encryptJson(plain, contentKey)
  const keys: Record<string, string> = {}
  for (const [uid, publicKey] of publicKeys)
    keys[uid] = await wrapContentKey(
      contentKey,
      await importPublicKey(publicKey),
    )
  contentKeys.set(key, contentKey)
  return { encrypted, keys }
}

// A plain item encrypted for everyone who has access (turning encryption
// on). `publicKeys` must cover them all.
export const encryptExisting = async (
  collection: TCollection,
  id: string,
  data: TData,
  publicKeys: Map<string, string>,
): Promise<TEncryptedFields> => {
  const plain = pick(collection, data)
  const contentKey = await generateContentKey()
  const encrypted = await encryptJson(plain, contentKey)
  const keys: Record<string, string> = {}
  for (const [uid, publicKey] of publicKeys)
    keys[uid] = await wrapContentKey(
      contentKey,
      await importPublicKey(publicKey),
    )
  contentKeys.set(cacheKey(collection, id), contentKey)
  plainContent.set(cacheKey(collection, id), plain)
  return { encrypted, keys }
}

// The decrypted content, to store an item as plain again (sharing it with
// someone who doesn't use encryption).
export const plainOf = (collection: TCollection, id: string) => {
  const plain = plainContent.get(cacheKey(collection, id))
  if (!plain) throw new Error('encryption/locked')
  return plain
}

export const forget = (collection: TCollection, id: string) => {
  contentKeys.delete(cacheKey(collection, id))
  plainContent.delete(cacheKey(collection, id))
  decrypted.delete(cacheKey(collection, id))
}
