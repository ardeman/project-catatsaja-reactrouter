import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { unlinkNote } from '~/apis/firestore/note'
import { TNoteResponse } from '~/lib/types/note'

import { toast } from './use-toast'

export const useUnlinkNote = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const { t } = useTranslation()

  const mutate = async (data: TNoteResponse) => {
    setIsPending(true)
    setIsError(false)
    try {
      await unlinkNote(data)
      toast({
        description: t('notes.toast.unlinked'),
      })
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
