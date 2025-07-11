import { useState } from 'react'

import { setNotePermission } from '~/apis/firestore/note'
import { TNotePermissionRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const useShareNote = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TNotePermissionRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await setNotePermission(data)
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
