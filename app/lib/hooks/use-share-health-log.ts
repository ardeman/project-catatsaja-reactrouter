import { useState } from 'react'

import { setHealthLogPermission } from '~/apis/firestore/health-log'
import {
  InviteRefused,
  RecipientWithoutEncryption,
} from '~/apis/firestore/shared-document'
import { THealthLogPermissionRequest } from '~/lib/types/health'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useShareHealthLog = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: THealthLogPermissionRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await setHealthLogPermission(data)
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
