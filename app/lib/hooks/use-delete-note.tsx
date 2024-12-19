import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { deleteNote } from '~/apis/firestore'
import { ToastAction } from '~/components/ui'
import { useCreateNote, useQueryActions, toast } from '~/lib/hooks'
import { TNoteResponse } from '~/lib/types'

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
