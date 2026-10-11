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
  // End-to-end encryption (thrown by the app itself).
  'encryption/wrong-passphrase': 'errors.wrongPassphrase',
  'encryption/wrong-recovery-code': 'errors.wrongRecoveryCode',
  'encryption/passkey-failed': 'errors.passkeyFailed',
  'encryption/passkey-unsupported': 'errors.passkeyUnsupported',
  'encryption/locked': 'errors.encryptionLocked',
  'encryption/not-set-up': 'errors.encryptionNotSetUp',
  // A passkey prompt dismissed or timed out.
  NotAllowedError: 'errors.passkeyCancelled',
}

const codeOf = (error: unknown) => {
  if (error instanceof FirebaseError) return error.code
  if (error instanceof DOMException) return error.name
  if (error instanceof Error && error.message.startsWith('encryption/'))
    return error.message
  return ''
}

export const getErrorMessage = (error: unknown) =>
  i18next.t(errorKeys[codeOf(error)] ?? 'errors.unknown')
