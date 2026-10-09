import { useState } from 'react'

import { updateNote } from '~/apis/firestore/note'
import { TUpdateNoteRequest } from '~/lib/types/note'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateNote = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TUpdateNoteRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await updateNote(data)
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
