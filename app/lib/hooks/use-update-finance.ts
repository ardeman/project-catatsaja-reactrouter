import { useState } from 'react'

import { updateFinance } from '~/apis/firestore/finance'
import { TUpdateFinanceRequest } from '~/lib/types/finance'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateFinance = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TUpdateFinanceRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await updateFinance(data)
      return true
    } catch (error: unknown) {
      setIsError(true)
      const message = getErrorMessage(error)
      toast({
        variant: 'destructive',
        description: message,
      })
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending, isError }
}
