import { onAuthStateChanged, type User } from 'firebase/auth'

import { auth } from '~/lib/configs/firebase'

export const waitForAuth = () =>
  new Promise<User | null>((resolve) => {
    if (!auth) {
      resolve(null)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribe()
      resolve(currentUser)
    })
  })
