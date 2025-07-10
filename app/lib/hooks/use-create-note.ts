import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { createNote } from '~/apis/firestore/note'
import { TCreateNoteRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const useCreateNote = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TCreateNoteRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await createNote(data)
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
