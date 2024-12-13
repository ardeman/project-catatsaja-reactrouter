import { useMutation } from '@tanstack/react-query'

import { unlinkNote } from '~/apis/firestore'
import { useQueryActions, toast } from '~/lib/hooks'
import { TNoteResponse } from '~/lib/types'

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
