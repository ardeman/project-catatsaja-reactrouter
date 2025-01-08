import { useMutation } from '@tanstack/react-query'

import { createNote } from '~/apis/firestore/note'
import { useQueryActions } from '~/lib/hooks/use-query-actions'
import { TCreateNoteRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const useCreateNote = () => {
  const { invalidateQueries: invalidateNotes } = useQueryActions(['notes'])
  return useMutation({
    mutationFn: (data: TCreateNoteRequest) => createNote(data),
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
