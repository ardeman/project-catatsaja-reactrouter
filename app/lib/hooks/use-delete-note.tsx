import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deleteNote } from '~/apis/firestore/note'
import { ToastAction } from '~/components/ui/toast'
import { TNoteResponse } from '~/lib/types/note'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { useCreateNote } from './use-create-note'
import { toast } from './use-toast'

export const useDeleteNote = () => {
  const [isPending, setIsPending] = useState(false)
  const { mutate: mutateCreateNote } = useCreateNote()
  const { t } = useTranslation()

  const mutate = async (note: TNoteResponse) => {
    setIsPending(true)
    try {
      const { isPinned: _isPinned, id: _id, ...data } = note
      await deleteNote(note)
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
      const message = getErrorMessage(error)
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
