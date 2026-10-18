import { exportDeviceKey, generateDeviceKey } from './push-seal'

// This device's push settings, in IndexedDB so the service worker
// (`public/sw.js`) can read them while the app is closed: the key pair that
// opens sealed push text (`push-seal.ts`) and whether to hide the details.
// `sw.js` opens the same database: keep the names in step.

const databaseName = 'push'
const storeName = 'device'

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.addEventListener('upgradeneeded', () =>
      request.result.createObjectStore(storeName),
    )
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })

const run = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest,
) => {
  const database = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(
        database.transaction(storeName, mode).objectStore(storeName),
      )
      request.addEventListener('success', () => resolve(request.result as T))
      request.addEventListener('error', () => reject(request.error))
    })
  } finally {
    database.close()
  }
}

// The device's public key (base64), made the first time push is turned on.
// The private key can't be exported, even by the app.
export const devicePublicKey = async () => {
  let pair = await run<CryptoKeyPair | undefined>('readonly', (store) =>
    store.get('key'),
  )
  if (!pair) {
    pair = await generateDeviceKey()
    await run('readwrite', (store) => store.put(pair, 'key'))
  }
  return exportDeviceKey(pair.publicKey)
}

// Signing out: a device that changes hands starts with a new key.
export const forgetDeviceKey = () =>
  run('readwrite', (store) => store.delete('key'))

// Hiding details: notifications say only what kind of thing happened,
// never an item's title, so nothing shows on a locked screen.
export const readHideDetails = async () =>
  (await run<boolean | undefined>('readonly', (store) =>
    store.get('hideDetails'),
  )) === true

export const saveHideDetails = (isHidden: boolean) =>
  run('readwrite', (store) => store.put(isHidden, 'hideDetails'))
