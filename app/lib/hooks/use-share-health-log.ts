import { useState } from 'react'

import { setHealthLogPermission } from '~/apis/firestore/health-log'
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
    } catch (error: unknown) {
      setIsError(true)
      const message = getErrorMessage(error)
      toast({
        variant: 'destructive',
        description: message,
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending, isError }
}
