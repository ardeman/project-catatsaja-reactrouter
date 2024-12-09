import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { useAuth } from 'reactfire'

import { authError } from '~/lib/constants'
import { useApp } from '~/lib/contexts'
import { toast } from '~/lib/hooks'

export const useLogout = () => {
  const auth = useAuth()
  const { setUser } = useApp()
  return useMutation({
    mutationFn: async () => {
      if (!auth) {
        throw new Error('Firebase is not initialized.')
      }
      setUser(undefined)
      await auth.signOut()
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
