import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { declineEncryption } from '~/apis/firestore/keyring'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// A new account choosing not to set up end-to-end encryption now; it stays
// available in Settings → Account.
export const useSkipEncryption = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)

  const mutate = async () => {
    setIsPending(true)
    try {
      await declineEncryption()
      revalidate()
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
