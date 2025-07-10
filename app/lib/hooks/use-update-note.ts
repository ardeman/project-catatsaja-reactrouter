import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { updateNote } from '~/apis/firestore/note'
import { TUpdateNoteRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const useUpdateNote = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TUpdateNoteRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await updateNote(data)
      revalidate()
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
