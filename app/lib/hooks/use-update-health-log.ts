import { useState } from 'react'

import { updateHealthLog } from '~/apis/firestore/health-log'
import { TUpdateHealthLogRequest } from '~/lib/types/health'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateHealthLog = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TUpdateHealthLogRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await updateHealthLog(data)
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
