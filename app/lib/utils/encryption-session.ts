// The unlocked private key of the signed-in person, kept for the session
// and in this browser's IndexedDB (as a non-extractable CryptoKey: usable,
// never readable), so the device stays unlocked until "Lock". Plus the
// keys and decrypted content of the items read so far.

type TStatus = 'unknown' | 'locked' | 'unlocked'

type TState = { status: TStatus; uid?: string }

let state: TState = { status: 'unknown' }
let privateKey: CryptoKey | undefined
let publicKey: string | undefined
const listeners = new Set<() => void>()

// Item keys and their decrypted content, by `collection/id`.
export const contentKeys = new Map<string, CryptoKey>()
export const plainContent = new Map<string, Record<string, unknown>>()

const setState = (next: TState) => {
  state = next
  for (const listener of listeners) listener()
}

export const subscribeToSession = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSessionState = () => state

export const getPrivateKey = () =>
  state.status === 'unlocked' ? privateKey : undefined

// The signed-in person's public key (spki, base64), to seal their own items.
export const getPublicKey = () =>
  state.status === 'unlocked' ? publicKey : undefined

// --- IndexedDB --------------------------------------------------------------

const DATABASE = 'catatsaja-encryption'
const STORE = 'keys'

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.addEventListener('upgradeneeded', () => {
      request.result.createObjectStore(STORE)
    })
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })

const withStore = async <T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(database.transaction(STORE, mode).objectStore(STORE))
      request.addEventListener('success', () => resolve(request.result))
      request.addEventListener('error', () => reject(request.error))
    })
  } finally {
    database.close()
  }
}

// --- Session --------------------------------------------------------------

// On load: unlocked if this browser kept the key for this person.
export const restoreSession = async (uid: string) => {
  if (state.status === 'unlocked' && state.uid === uid) return true
  try {
    const kept = await withStore<
      { privateKey: CryptoKey; publicKey: string } | undefined
    >('readonly', (store) => store.get(uid))
    if (kept?.privateKey) {
      privateKey = kept.privateKey
      publicKey = kept.publicKey
      setState({ status: 'unlocked', uid })
      return true
    }
  } catch {
    // Storage blocked (private window): unlock each visit instead.
  }
  setState({ status: 'locked', uid })
  return false
}

export const startSession = async (
  uid: string,
  key: CryptoKey,
  ownPublicKey: string,
) => {
  privateKey = key
  publicKey = ownPublicKey
  try {
    await withStore('readwrite', (store) =>
      store.put({ privateKey: key, publicKey: ownPublicKey }, uid),
    )
  } catch {
    // Not kept: this visit only.
  }
  setState({ status: 'unlocked', uid })
}

export const lockSession = async () => {
  const uid = state.uid
  privateKey = undefined
  publicKey = undefined
  contentKeys.clear()
  plainContent.clear()
  if (uid) {
    try {
      await withStore('readwrite', (store) => store.delete(uid))
    } catch {
      // Nothing kept.
    }
  }
  setState({ status: 'locked', uid })
}

// Signing out: forget the key here, like locking.
export const endSession = async () => {
  await lockSession()
  setState({ status: 'unknown' })
}
