import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { deleteNote } from '~/apis/firestore/note'
import { ToastAction } from '~/components/ui/toast'
import { TNoteResponse } from '~/lib/types/note'

import { useCreateNote } from './use-create-note'
import { useQueryActions } from './use-query-actions'
import { toast } from './use-toast'

export const useDeleteNote = () => {
  const { invalidateQueries: invalidateNotes } = useQueryActions(['notes'])
  const { mutate: mutateCreateNote } = useCreateNote()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (note: TNoteResponse) => deleteNote(note),
    onSuccess: (note: TNoteResponse) => {
      const { isPinned: _isPinned, id: _id, ...data } = note
      invalidateNotes()
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
    },
    onError: (error: unknown) => {
      const message = String(error)
      toast({
        variant: 'destructive',
        description: message,
      })
    },
  })
}
