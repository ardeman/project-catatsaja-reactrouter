import { useState } from 'react'

import { unlinkNote } from '~/apis/firestore/note'
import { TNoteResponse } from '~/lib/types/note'

import { toast } from './use-toast'

export const useUnlinkNote = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TNoteResponse) => {
    setIsPending(true)
    setIsError(false)
    try {
      await unlinkNote(data)
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
