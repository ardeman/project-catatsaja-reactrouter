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
  'auth/account-exists-with-different-credential': 'errors.accountExists',
  // End-to-end encryption (thrown by the app itself).
  'encryption/wrong-passphrase': 'errors.wrongPassphrase',
  'encryption/wrong-recovery-code': 'errors.wrongRecoveryCode',
  'encryption/passkey-failed': 'errors.passkeyFailed',
  'encryption/passkey-unsupported': 'errors.passkeyUnsupported',
  'encryption/locked': 'errors.encryptionLocked',
  'encryption/not-set-up': 'errors.encryptionNotSetUp',
  // Firebase AI Logic (Gemini), and what the app throws for its answers.
  'fetch-error': 'errors.aiUnavailable',
  'api-not-enabled': 'errors.aiUnavailable',
  'response-error': 'errors.receiptUnreadable',
  'parse-failed': 'errors.receiptUnreadable',
  'invalid-content': 'errors.receiptUnreadable',
  'receipt/unreadable': 'errors.receiptUnreadable',
  'receipt/empty': 'errors.receiptEmpty',
  'image/unreadable': 'errors.imageUnreadable',
  'typed/unreadable': 'errors.typedUnreadable',
  'typed/empty': 'errors.typedEmpty',
  'note/unreadable': 'errors.noteUnreadable',
  'task/unreadable': 'errors.noteUnreadable',
  'dictation/unreadable': 'errors.noteUnreadable',
  'dictation/empty': 'errors.dictationEmpty',
  'dictation/microphone': 'errors.microphone',
  'dictation/unsupported': 'errors.dictationUnsupported',
  // A passkey prompt dismissed or timed out.
  NotAllowedError: 'errors.passkeyCancelled',
}

// Codes the app throws itself, as the error's message.
const appCodes = [
  'encryption/',
  'receipt/',
  'image/',
  'typed/',
  'note/',
  'task/',
  'dictation/',
]

const codeOf = (error: unknown) => {
  if (error instanceof FirebaseError) {
    // Gemini's rate limit arrives as a fetch error with HTTP status 429.
    const { customErrorData } = error as {
      customErrorData?: { status?: number }
    }
    return customErrorData?.status === 429 ? 'resource-exhausted' : error.code
  }
  if (error instanceof DOMException) return error.name
  return error instanceof Error &&
    appCodes.some((prefix) => error.message.startsWith(prefix))
    ? error.message
    : ''
}

export const getErrorMessage = (error: unknown) =>
  i18next.t(errorKeys[codeOf(error)] ?? 'errors.unknown')
