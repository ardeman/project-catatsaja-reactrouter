import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'

import { login } from '~/apis/firestore'
import { authError } from '~/lib/constants'
import { useQueryActions, toast } from '~/lib/hooks'
import { TSignInRequest } from '~/lib/types'

export const useLogin = () => {
  const { invalidateQueries: invalidateUser } = useQueryActions(['auth-user'])
  return useMutation({
    mutationFn: (data: TSignInRequest) => login(data),
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
