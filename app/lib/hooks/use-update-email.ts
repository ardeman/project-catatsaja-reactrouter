import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { verifyBeforeUpdateEmail } from 'firebase/auth'
import { useTranslation } from 'react-i18next'

import { auth } from '~/lib/configs'
import { authError } from '~/lib/constants'
import { toast } from '~/lib/hooks'
import { TEmailRequest } from '~/lib/types'

export const useUpdateEmail = () => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (data: TEmailRequest) => {
      if (!auth?.currentUser) {
        throw new Error('No user is currently signed in.')
      }

      await verifyBeforeUpdateEmail(auth.currentUser, data.email)
    },
    onSuccess: () => {
      toast({
        description: t('auth.toast.updateEmail'),
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
