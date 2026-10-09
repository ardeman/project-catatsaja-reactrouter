import { useState } from 'react'

import { setTaskPermission } from '~/apis/firestore/task'
import { TTaskPermissionRequest } from '~/lib/types/task'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useShareTask = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TTaskPermissionRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await setTaskPermission(data)
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
