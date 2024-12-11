import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'

import { authError } from '~/lib/constants'
import { loginWithGoogle } from '~/lib/firestore'
import { useQueryActions, toast } from '~/lib/hooks'

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
