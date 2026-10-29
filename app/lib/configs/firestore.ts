import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

import { firebase } from '~/lib/configs/app-check'
import { useEmulators } from '~/lib/configs/firebase'

// Kept apart from `firebase.ts` so the public pages, which only need to know
// who is signed in, don't download Firestore (or App Check, imported first).
let firestore: Firestore | null = null

if (firebase) {
  try {
    // Items are kept in the browser (IndexedDB) for offline use: saves made
    // offline survive a reload and upload once back online, shared by every
    // open tab. Encrypted items stay encrypted there; signing out deletes it
    // (`clearOfflineData`). Without IndexedDB it works from memory.
    firestore = initializeFirestore(firebase, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
    if (useEmulators)
      connectFirestoreEmulator(firestore, location.hostname, 8080)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing Firestore:', error)
  }
}

export { firestore }
