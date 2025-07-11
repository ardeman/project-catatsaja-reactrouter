import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createNote } from '~/apis/firestore/note'
import { TCreateNoteRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const useCreateNote = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const { t } = useTranslation()

  const mutate = async (data: TCreateNoteRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      const reference = await createNote(data)
      toast({
        description: t('notes.toast.created'),
      })
      return reference
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
