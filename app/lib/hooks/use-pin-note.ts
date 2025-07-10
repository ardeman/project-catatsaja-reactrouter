import { useState } from 'react'

import { pinNote } from '~/apis/firestore/note'
import { TPinNoteRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const usePinNote = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TPinNoteRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await pinNote(data)
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
