import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'

import { login } from '~/apis/firestore/user'
import { authError } from '~/lib/constants/firebase'
import { useQueryActions } from '~/lib/hooks/use-query-actions'
import { TSignInRequest } from '~/lib/types/user'

import { toast } from './use-toast'

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
