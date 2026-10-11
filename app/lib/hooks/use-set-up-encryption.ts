import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { createKeyring } from '~/apis/firestore/keyring'
import { encryptOwnItems } from '~/apis/firestore/shared-document'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// Turning encryption on: keys sealed with the passphrase and recovery code,
// then the person's own items encrypted.
export const useSetUpEncryption = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)

  const mutate = async (passphrase: string, recoveryCode: string) => {
    setIsPending(true)
    try {
      await createKeyring(passphrase, recoveryCode)
      revalidate()
      void encryptOwnItems().catch(() => {
        // Tried again on the next unlocked visit.
      })
      return true
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
