import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { doc, updateDoc } from 'firebase/firestore'
import { useFirestore, useUser } from 'reactfire'

import { authError } from '~/lib/constants'
import { useToast } from '~/lib/hooks'
import { TUpdateProfileRequest } from '~/lib/types'

export const useUpdateProfile = () => {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { data: user } = useUser()
  return useMutation({
    mutationFn: async (data: TUpdateProfileRequest) => {
      if (!firestore) {
        throw new Error('Firebase Firestore is not initialized.')
      }
      if (!user) {
        throw new Error('No user is currently signed in.')
      }
      const { ...rest } = data
      const ref = doc(firestore, 'users', user.uid)
      return await updateDoc(ref, {
        ...rest,
        updatedAt: new Date(),
      })
    },
    onSuccess: () => {
      toast({
        description: 'Your profile has been updated successfully.',
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
