import { useState } from 'react'

import { pinFinance } from '~/apis/firestore/finance'
import { TPinFinanceRequest } from '~/lib/types/finance'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const usePinFinance = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TPinFinanceRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await pinFinance(data)
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
