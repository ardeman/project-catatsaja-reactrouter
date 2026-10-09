import { useState } from 'react'

import { updateTask } from '~/apis/firestore/task'
import { TUpdateTaskRequest } from '~/lib/types/task'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateTask = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TUpdateTaskRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await updateTask(data)
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
