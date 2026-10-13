// The unlocked private key of the signed-in person, kept for the session
// and in this browser's IndexedDB (as a non-extractable CryptoKey: usable,
// never readable), so the device stays unlocked until "Lock". Plus the
// keys and decrypted content of the items read so far.

type TStatus = 'unknown' | 'locked' | 'unlocked'

type TState = { status: TStatus; uid?: string }

const session: { state: TState; privateKey?: CryptoKey; publicKey?: string } = {
  state: { status: 'unknown' },
}
const listeners = new Set<() => void>()

// Item keys and their decrypted content, by `collection/id`.
export const contentKeys = new Map<string, CryptoKey>()
export const plainContent = new Map<string, Record<string, unknown>>()
// The last stored version of each item that was decrypted, by `collection/id`:
// its blob's IV (new on every write) and this person's sealed key. A list
// update re-reads every item, so unchanged ones are taken from here instead
// of being decrypted again.
export const decrypted = new Map<
  string,
  {
    iv: string
    wrapped: string
    contentKey: CryptoKey
    plain: Record<string, unknown>
  }
>()

const setState = (next: TState) => {
  session.state = next
  for (const listener of listeners) listener()
}

export const subscribeToSession = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSessionState = () => session.state

export const getPrivateKey = () =>
  session.state.status === 'unlocked' ? session.privateKey : undefined

// The signed-in person's public key (spki, base64), to seal their own items.
export const getPublicKey = () =>
  session.state.status === 'unlocked' ? session.publicKey : undefined

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
  if (session.state.status === 'unlocked' && session.state.uid === uid)
    return true
  try {
    const kept = await withStore<
      { privateKey: CryptoKey; publicKey: string } | undefined
    >('readonly', (store) => store.get(uid))
    if (kept?.privateKey) {
      session.privateKey = kept.privateKey
      session.publicKey = kept.publicKey
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
  session.privateKey = key
  session.publicKey = ownPublicKey
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
  const uid = session.state.uid
  session.privateKey = undefined
  session.publicKey = undefined
  contentKeys.clear()
  plainContent.clear()
  decrypted.clear()
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
