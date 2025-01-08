import { useRevalidator } from '@remix-run/react'
import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { useTranslation } from 'react-i18next'

import { register } from '~/apis/firestore/user'
import { authError } from '~/lib/constants/firebase'
import { useQueryActions } from '~/lib/hooks/use-query-actions'
import { TSignUpRequest } from '~/lib/types/user'

import { toast } from './use-toast'

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
