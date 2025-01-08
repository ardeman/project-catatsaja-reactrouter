import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'

import { loginWithGoogle } from '~/apis/firestore/user'
import { authError } from '~/lib/constants/firebase'
import { useQueryActions } from '~/lib/hooks/use-query-actions'

import { toast } from './use-toast'

export const useLoginGoogle = () => {
  const { invalidateQueries: invalidateUser } = useQueryActions(['auth-user'])
  return useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: () => {
      invalidateUser()
    },
    onError: (error: unknown) => {
      let message = String(error)
      if (error instanceof FirebaseError) {
        message =
          authError.find((item) => item.code === error.code)?.message ||
          error.message
      }
      toast({
        variant: 'destructive',
        description: message,
      })
    },
  })
}
