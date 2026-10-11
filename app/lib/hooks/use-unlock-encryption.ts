import { useState } from 'react'

import {
  fetchKeyring,
  recoverWithCode,
  unlockWithPassphrase,
  unlockWithPasskeySecret,
} from '~/apis/firestore/keyring'
import { getErrorMessage } from '~/lib/utils/firebase-error'
import { readPasskeySecret } from '~/lib/utils/passkey'

// Unlocking this device: with the passphrase, a passkey, or the recovery
// code (which also sets a new passphrase). Errors come back as a message
// for the form, not a toast.
export const useUnlockEncryption = () => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()

  const run = async (unlock: () => Promise<void>) => {
    setIsPending(true)
    setError(undefined)
    try {
      await unlock()
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
    withPassphrase: (passphrase: string) =>
      run(() => unlockWithPassphrase(passphrase)),
    withRecoveryCode: (code: string, newPassphrase: string) =>
      run(() => recoverWithCode(code, newPassphrase)),
    withPasskey: () =>
      run(async () => {
        const keyring = await fetchKeyring()
        const passkeys = keyring?.passkeys ?? []
        if (!keyring || passkeys.length === 0)
          throw new Error('encryption/passkey-failed')
        const { id, secret } = await readPasskeySecret(passkeys)
        const seal = passkeys.find((passkey) => passkey.id === id)
        if (!seal) throw new Error('encryption/passkey-failed')
        await unlockWithPasskeySecret(keyring, seal, secret)
      }),
  }
}
