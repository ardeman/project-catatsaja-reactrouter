import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'

import { authError } from '~/lib/constants'
import { updateProfile } from '~/lib/firestore'
import { useQueryActions, toast } from '~/lib/hooks'
import { TUpdateProfileRequest } from '~/lib/types'

export const useUpdateProfile = () => {
  const { invalidateQueries: invalidateCurrentUser } = useQueryActions([
    'current-user',
  ])
  return useMutation({
    mutationFn: (data: TUpdateProfileRequest) => updateProfile(data),
    onSuccess: () => {
      toast({
        description: 'Your profile has been updated successfully.',
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
