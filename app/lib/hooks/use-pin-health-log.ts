import { useState } from 'react'

import { pinHealthLog } from '~/apis/firestore/health-log'
import { TPinHealthLogRequest } from '~/lib/types/health'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const usePinHealthLog = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TPinHealthLogRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await pinHealthLog(data)
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
