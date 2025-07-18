import { useState } from 'react'

import { updateTask } from '~/apis/firestore/task'
import { TUpdateTaskRequest } from '~/lib/types/task'

import { toast } from './use-toast'

export const useUpdateTask = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TUpdateTaskRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await updateTask(data)
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
