import { useMutation } from '@tanstack/react-query'

import { setNotePermission } from '~/apis/firestore'
import { useQueryActions, toast } from '~/lib/hooks'
import { TNotePermissionRequest } from '~/lib/types'

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
