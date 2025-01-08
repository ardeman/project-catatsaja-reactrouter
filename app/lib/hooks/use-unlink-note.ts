import { useMutation } from '@tanstack/react-query'

import { unlinkNote } from '~/apis/firestore/note'
import { useQueryActions } from '~/lib/hooks/use-query-actions'
import { TNoteResponse } from '~/lib/types/note'

import { toast } from './use-toast'

export const useUnlinkNote = () => {
  const { invalidateQueries: invalidateNotes } = useQueryActions(['notes'])
  return useMutation({
    mutationFn: (data: TNoteResponse) => unlinkNote(data),
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
