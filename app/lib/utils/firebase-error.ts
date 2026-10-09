import { FirebaseError } from 'firebase/app'
import i18next from 'i18next'

// Firebase error codes mapped to `errors.*` keys in common.json.
const errorKeys: Record<string, string> = {
  'permission-denied': 'errors.permissionDenied',
  'not-found': 'errors.notFound',
  unavailable: 'errors.offline',
  'deadline-exceeded': 'errors.offline',
  'auth/network-request-failed': 'errors.offline',
  'resource-exhausted': 'errors.tooManyRequests',
  'auth/too-many-requests': 'errors.tooManyRequests',
  'auth/invalid-credential': 'errors.invalidCredential',
  'auth/wrong-password': 'errors.invalidCredential',
  'auth/user-not-found': 'errors.invalidCredential',
  'auth/invalid-email': 'errors.invalidEmail',
  'auth/email-already-in-use': 'errors.emailInUse',
  'auth/weak-password': 'errors.weakPassword',
  'auth/requires-recent-login': 'errors.recentLogin',
  'auth/popup-closed-by-user': 'errors.popupClosed',
  'auth/cancelled-popup-request': 'errors.popupClosed',
  'auth/credential-already-in-use': 'errors.credentialInUse',
}

export const getErrorMessage = (error: unknown) => {
  const code = error instanceof FirebaseError ? error.code : ''
  return i18next.t(errorKeys[code] ?? 'errors.unknown')
}
