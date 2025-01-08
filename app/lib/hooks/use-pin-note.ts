import { useMutation } from '@tanstack/react-query'

import { pinNote } from '~/apis/firestore/note'
import { useQueryActions } from '~/lib/hooks/use-query-actions'
import { TPinNoteRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const usePinNote = () => {
  const { invalidateQueries: invalidateNotes } = useQueryActions(['notes'])
  return useMutation({
    mutationFn: (data: TPinNoteRequest) => pinNote(data),
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
