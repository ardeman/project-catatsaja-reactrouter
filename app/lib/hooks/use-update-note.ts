import { useMutation } from '@tanstack/react-query'

import { updateNote } from '~/apis/firestore/note'
import { useQueryActions } from '~/lib/hooks/use-query-actions'
import { TUpdateNoteRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const useUpdateNote = () => {
  const { invalidateQueries: invalidateNotes } = useQueryActions(['notes'])
  return useMutation({
    mutationFn: (data: TUpdateNoteRequest) => updateNote(data),
    onSuccess: () => {
      invalidateNotes()
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
