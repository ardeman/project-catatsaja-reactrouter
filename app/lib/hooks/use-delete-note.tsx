import { useMutation } from '@tanstack/react-query'

import { ToastAction } from '~/components/ui'
import { deleteNote } from '~/lib/firestore'
import { useCreateNote, useQueryActions, toast } from '~/lib/hooks'
import { TNoteResponse } from '~/lib/types'

export const useDeleteNote = () => {
  const { invalidateQueries: invalidateNotes } = useQueryActions(['notes'])
  const { mutate: mutateCreateNote } = useCreateNote()

  return useMutation({
    mutationFn: (note: TNoteResponse) => deleteNote(note),
    onSuccess: (note: TNoteResponse) => {
      const { isPinned: _isPinned, id: _id, ...data } = note
      invalidateNotes()
      toast({
        description: 'Note deleted successfully',
        action: (
          <ToastAction
            altText="Undo"
            onClick={() => mutateCreateNote(data)}
          >
            Undo
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
