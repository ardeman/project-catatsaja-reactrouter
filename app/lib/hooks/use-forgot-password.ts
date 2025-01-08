import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useTranslation } from 'react-i18next'

import { auth } from '~/lib/configs/firebase'
import { authError } from '~/lib/constants/firebase'
import { toast } from '~/lib/hooks/use-toast'
import { TEmailRequest } from '~/lib/types/user'

export const useForgotPassword = () => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (data: TEmailRequest) => {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized.')
      }
      await sendPasswordResetEmail(auth, data.email)
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
