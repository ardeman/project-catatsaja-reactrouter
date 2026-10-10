import { useState } from 'react'

import { setFinancePermission } from '~/apis/firestore/finance'
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
