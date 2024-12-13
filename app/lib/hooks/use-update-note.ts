import { useMutation } from '@tanstack/react-query'

import { updateNote } from '~/apis/firestore'
import { useQueryActions, toast } from '~/lib/hooks'
import { TUpdateNoteRequest } from '~/lib/types'

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
