import { useState } from 'react'

import {
  addPasskeySeal,
  changePassphrase,
  openForResealing,
  removePasskeys,
  replaceRecoveryCode,
} from '~/apis/firestore/keyring'
import { auth } from '~/lib/configs/firebase'
import { lockSession } from '~/lib/utils/encryption-session'
import { getErrorMessage } from '~/lib/utils/firebase-error'
import { createPasskey } from '~/lib/utils/passkey'

// Managing encryption from the settings: a new passphrase or recovery code,
// passkeys, and locking this device. Errors come back as a message for the
// form.
export const useUpdateEncryption = () => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()

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
    clearError: () => setError(undefined),
    changePassphrase: (current: string, next: string) =>
      run(() => changePassphrase(current, next)),
    replaceRecoveryCode: (passphrase: string, code: string) =>
      run(() => replaceRecoveryCode(passphrase, code)),
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
    removePasskeys: () => run(() => removePasskeys()),
    lock: () => run(() => lockSession()),
  }
}
