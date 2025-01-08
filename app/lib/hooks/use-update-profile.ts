import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { useTranslation } from 'react-i18next'

import { updateProfile } from '~/apis/firestore/user'
import { authError } from '~/lib/constants/firebase'
import { TUpdateProfileRequest } from '~/lib/types/settings'

import { useQueryActions } from './use-query-actions'
import { toast } from './use-toast'

export const useUpdateProfile = () => {
  const { invalidateQueries: invalidateCurrentUser } = useQueryActions([
    'current-user',
  ])
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: TUpdateProfileRequest) => updateProfile(data),
    onSuccess: () => {
      toast({
        description: t('auth.toast.profileUpdated'),
      })
      invalidateCurrentUser()
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
