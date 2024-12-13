import { useMutation } from '@tanstack/react-query'

import { createNote } from '~/apis/firestore'
import { useQueryActions, toast } from '~/lib/hooks'
import { TCreateNoteRequest } from '~/lib/types'

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
