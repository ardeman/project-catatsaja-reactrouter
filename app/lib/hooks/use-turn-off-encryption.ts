import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { openForResealing, removeKeyring } from '~/apis/firestore/keyring'
import {
  countEncryptedFromOthers,
  decryptOwnItems,
} from '~/apis/firestore/shared-document'
import { endSession } from '~/lib/utils/encryption-session'
import { getErrorMessage } from '~/lib/utils/firebase-error'

// Turning encryption off: checked with the passphrase, then the person's
// own items stored plain again, then their keys removed. Each step can be
// retried: the keys go last, so a failure midway loses nothing.
export const useTurnOffEncryption = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()

  const mutate = async (passphrase: string) => {
    setIsPending(true)
    setError(undefined)
    try {
      await openForResealing(passphrase)
      await decryptOwnItems()
      await removeKeyring()
      await endSession()
      revalidate()
      return true
    } catch (error_: unknown) {
      setError(getErrorMessage(error_))
      return false
    } finally {
      setIsPending(false)
    }
  }

  return {
    mutate,
    isPending,
    error,
    clearError: () => setError(undefined),
    // Shared with the person, encrypted by someone else: unreadable to them
    // once they turn encryption off.
    countFromOthers: countEncryptedFromOthers,
  }
}
