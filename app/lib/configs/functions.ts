import {
  connectFunctionsEmulator,
  Functions,
  getFunctions,
} from 'firebase/functions'

import { firebase } from '~/lib/configs/app-check'
import { useEmulators } from '~/lib/configs/firebase'

// Cloud Functions (asia-southeast2), used for prepaid Plus checkout tokens.
let functions: Functions | null = null

if (firebase) {
  try {
    functions = getFunctions(firebase, 'asia-southeast2')
    if (useEmulators)
      connectFunctionsEmulator(functions, location.hostname, 5001)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing Functions:', error)
  }
}

export { functions }
