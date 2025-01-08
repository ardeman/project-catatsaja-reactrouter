import { useMutation } from '@tanstack/react-query'

import { setNotePermission } from '~/apis/firestore/note'
import { useQueryActions } from '~/lib/hooks/use-query-actions'
import { TNotePermissionRequest } from '~/lib/types/note'

import { toast } from './use-toast'

export const useShareNote = () => {
  const { invalidateQueries: invalidateNotes } = useQueryActions(['notes'])
  return useMutation({
    mutationFn: (data: TNotePermissionRequest) => setNotePermission(data),
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
