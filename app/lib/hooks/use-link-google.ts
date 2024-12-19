import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, linkWithPopup } from 'firebase/auth'
import { useTranslation } from 'react-i18next'

import { auth } from '~/lib/configs'
import { authError } from '~/lib/constants'
import { useQueryActions, toast } from '~/lib/hooks'

export const useLinkGoogle = () => {
  const provider = new GoogleAuthProvider()
  const { invalidateQueries: invalidateUser } = useQueryActions(['auth-user'])
  const { t } = useTranslation()

  return useMutation({
    mutationFn: () => {
      if (!auth?.currentUser) {
        throw new Error('No user is currently signed in.')
      }
      return linkWithPopup(auth.currentUser, provider)
    },
    onSuccess: () => {
      toast({
        description: t('auth.toast.linkGoogle'),
      })
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
