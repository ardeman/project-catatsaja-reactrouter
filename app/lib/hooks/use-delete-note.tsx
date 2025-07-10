import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { deleteNote } from '~/apis/firestore/note'
import { ToastAction } from '~/components/ui/toast'
import { TNoteResponse } from '~/lib/types/note'

import { useCreateNote } from './use-create-note'
import { toast } from './use-toast'

export const useDeleteNote = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)
  const { mutate: mutateCreateNote } = useCreateNote()
  const { t } = useTranslation()

  const mutate = async (note: TNoteResponse) => {
    setIsPending(true)
    try {
      const { isPinned: _isPinned, id: _id, ...data } = note
      await deleteNote(note)
      revalidate()
      toast({
        description: t('notes.toast.deleted'),
        action: (
          <ToastAction
            altText="Undo"
            onClick={() => mutateCreateNote(data)}
          >
            {t('form.undo')}
          </ToastAction>
        ),
      })
    } catch (error: unknown) {
      const message = String(error)
      toast({
        variant: 'destructive',
        description: message,
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
