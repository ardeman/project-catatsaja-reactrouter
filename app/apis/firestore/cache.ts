import {
  clearIndexedDbPersistence,
  terminate,
  waitForPendingWrites,
} from 'firebase/firestore'

import { firestore } from '~/lib/configs/firebase'

// How long signing out waits for saves made offline to reach the server.
const PENDING_WRITES_WAIT = 3000

// Signing out: what was saved offline gets a moment to upload, then this
// device's copy of the person's items (the offline cache) is deleted. The
// Firestore connection can't be used afterwards: the page must reload.
export const clearOfflineData = async () => {
  if (!firestore) return
  const uploaded = async () => {
    try {
      await waitForPendingWrites(firestore!)
    } catch {
      // Offline for good: what didn't upload is lost with the cache.
    }
  }
  await Promise.race([
    uploaded(),
    new Promise((resolve) => setTimeout(resolve, PENDING_WRITES_WAIT)),
  ])
  await terminate(firestore)
  try {
    await clearIndexedDbPersistence(firestore)
  } catch {
    // Another tab still has it open: it is cleared on its next sign-out.
  }
}
