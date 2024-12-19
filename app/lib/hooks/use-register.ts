import { useRevalidator } from '@remix-run/react'
import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { useTranslation } from 'react-i18next'

import { register } from '~/apis/firestore'
import { authError } from '~/lib/constants'
import { useQueryActions, toast } from '~/lib/hooks'
import { TSignUpRequest } from '~/lib/types'

export const useRegister = () => {
  const { revalidate } = useRevalidator()
  const { invalidateQueries: invalidateUser } = useQueryActions(['auth-user'])
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: TSignUpRequest) => register(data),
    onSuccess: () => {
      invalidateUser()
      toast({
        description: t('auth.toast.emailVerify'),
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
