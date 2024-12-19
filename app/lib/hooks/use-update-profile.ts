import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { useTranslation } from 'react-i18next'

import { updateProfile } from '~/apis/firestore'
import { authError } from '~/lib/constants'
import { useQueryActions, toast } from '~/lib/hooks'
import { TUpdateProfileRequest } from '~/lib/types'

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
