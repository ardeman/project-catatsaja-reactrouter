import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { sendEmailVerification } from 'firebase/auth'
import { useTranslation } from 'react-i18next'

import { auth } from '~/lib/configs'
import { authError } from '~/lib/constants'
import { toast } from '~/lib/hooks'

export const useEmailVerification = () => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: () => {
      if (!auth?.currentUser) {
        throw new Error('No user is currently signed in.')
      }
      return sendEmailVerification(auth.currentUser)
    },
    onSuccess: () => {
      toast({
        description: t('auth.toast.verificationSent'),
      })
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
