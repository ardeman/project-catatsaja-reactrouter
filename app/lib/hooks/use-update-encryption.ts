import { useState } from 'react'

import {
  addPasskeySeal,
  changePassphrase,
  fetchKeyring,
  openForResealing,
  removePasskeys,
  replaceRecoveryCode,
  resetWithPasskeySecret,
} from '~/apis/firestore/keyring'
import { hasPasswordSignIn, reauthenticate } from '~/apis/firestore/user'
import { auth } from '~/lib/configs/firebase'
import { lockSession } from '~/lib/utils/encryption-session'
import { getErrorMessage } from '~/lib/utils/firebase-error'
import { createPasskey, readPasskeySecret } from '~/lib/utils/passkey'

// Managing encryption from the settings: a new passphrase or recovery code
// (with a passkey when the passphrase is forgotten), passkeys, and locking
// this device. Errors come back as a message for the form.
//
// Resetting with a passkey and removing passkeys need the account's sign-in
// again, so someone holding an unlocked device can't: the password, typed
// with the change, or Google's popup, which `signInAgain` opens first (its
// own tap, so the passkey prompt after it isn't blocked).
export const useUpdateEncryption = () => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()
  const [hasSignedInAgain, setHasSignedInAgain] = useState(false)

  const checkSignIn = async (password: string) => {
    if (hasPasswordSignIn()) await reauthenticate(password)
    else if (!hasSignedInAgain) throw new Error('auth/requires-recent-login')
  }

  const run = async (action: () => Promise<void>) => {
    setIsPending(true)
    setError(undefined)
    try {
      await action()
      return true
    } catch (error_: unknown) {
      setError(getErrorMessage(error_))
      return false
    } finally {
      setIsPending(false)
    }
  }

  return {
    isPending,
    error,
    // Also forgets a Google sign-in again: it counts for one dialog.
    clearError: () => {
      setError(undefined)
      setHasSignedInAgain(false)
    },
    changePassphrase: (current: string, next: string) =>
      run(() => changePassphrase(current, next)),
    replaceRecoveryCode: (passphrase: string, code: string) =>
      run(() => replaceRecoveryCode(passphrase, code)),
    needsPassword: hasPasswordSignIn(),
    hasSignedInAgain,
    signInAgain: () =>
      run(async () => {
        await reauthenticate()
        setHasSignedInAgain(true)
      }),
    resetWithPasskey: (password: string, newPassphrase: string, code: string) =>
      run(async () => {
        await checkSignIn(password)
        const keyring = await fetchKeyring()
        const passkeys = keyring?.passkeys ?? []
        if (passkeys.length === 0) throw new Error('encryption/passkey-failed')
        const { id, secret } = await readPasskeySecret(passkeys)
        const seal = passkeys.find((passkey) => passkey.id === id)
        if (!seal) throw new Error('encryption/passkey-failed')
        await resetWithPasskeySecret(seal, secret, newPassphrase, code)
      }),
    addPasskey: (passphrase: string) =>
      run(async () => {
        const user = auth?.currentUser
        if (!user) throw new Error('encryption/not-set-up')
        // The passphrase first: a typo mustn't leave a useless passkey.
        const extractable = await openForResealing(passphrase)
        const passkey = await createPasskey({
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? '',
        })
        await addPasskeySeal(extractable, passkey)
      }),
    removePasskeys: (password: string) =>
      run(async () => {
        await checkSignIn(password)
        await removePasskeys()
      }),
    lock: () => run(() => lockSession()),
  }
}
