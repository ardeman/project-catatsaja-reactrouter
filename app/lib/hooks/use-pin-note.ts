import { useMutation } from '@tanstack/react-query'

import { pinNote } from '~/apis/firestore'
import { useQueryActions, toast } from '~/lib/hooks'
import { TPinNoteRequest } from '~/lib/types'

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
