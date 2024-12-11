import { useRevalidator } from '@remix-run/react'
import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'

import { authError } from '~/lib/constants'
import { register } from '~/lib/firestore'
import { useQueryActions, toast } from '~/lib/hooks'
import { TSignUpRequest } from '~/lib/types'

export const useRegister = () => {
  const { revalidate } = useRevalidator()
  const { invalidateQueries: invalidateUser } = useQueryActions(['auth-user'])
  return useMutation({
    mutationFn: (data: TSignUpRequest) => register(data),
    onSuccess: () => {
      invalidateUser()
      toast({
        description: 'Please check your email to verify your account.',
      })
      revalidate()
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
