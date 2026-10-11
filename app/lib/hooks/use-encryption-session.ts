import { useSyncExternalStore } from 'react'

import {
  getSessionState,
  subscribeToSession,
} from '~/lib/utils/encryption-session'

const unknown = { status: 'unknown' as const }

// Whether this device has the signed-in person's encryption key unlocked.
export const useEncryptionSession = () =>
  useSyncExternalStore(subscribeToSession, getSessionState, () => unknown)
