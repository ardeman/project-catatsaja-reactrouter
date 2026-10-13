import { useState } from 'react'

import { setFinancePermission } from '~/apis/firestore/finance'
import {
  InviteRefused,
  RecipientWithoutEncryption,
} from '~/apis/firestore/shared-document'
import { TFinancePermissionRequest } from '~/lib/types/finance'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useShareFinance = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TFinancePermissionRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await setFinancePermission(data)
      return 'shared' as const
    } catch (error: unknown) {
      // Encrypted, and the person hasn't turned encryption on: the share
      // dialog asks whether to share it without encryption.
      if (error instanceof RecipientWithoutEncryption)
        return 'needsPlain' as const
      // They can't be invited by this person: the dialog says so.
      if (error instanceof InviteRefused) return 'refused' as const
      setIsError(true)
      const message = getErrorMessage(error)
      toast({
        variant: 'destructive',
        description: message,
      })
      return 'failed' as const
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending, isError }
}
