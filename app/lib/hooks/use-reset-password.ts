import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useTranslation } from 'react-i18next'

import { auth } from '~/lib/configs'
import { authError } from '~/lib/constants'
import { toast } from '~/lib/hooks'

export const useResetPassword = () => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: () => {
      if (!auth?.currentUser?.email) {
        throw new Error('No user is currently signed in.')
      }
      return sendPasswordResetEmail(auth, auth.currentUser.email)
    },
    onSuccess: () => {
      toast({
        description: t('auth.toast.resetPassword'),
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
