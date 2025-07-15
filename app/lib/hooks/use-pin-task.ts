import { useState } from 'react'

import { pinTask } from '~/apis/firestore/task'
import { TPinTaskRequest } from '~/lib/types/task'

import { toast } from './use-toast'

export const usePinTask = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TPinTaskRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await pinTask(data)
    } catch (error: unknown) {
      setIsError(true)
      const message = String(error)
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
