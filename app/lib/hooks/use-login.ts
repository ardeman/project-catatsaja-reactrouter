import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useAuth, useFirestore } from 'reactfire'

import { authError } from '~/lib/constants'
import { useToast } from '~/lib/hooks'
import { TSignInRequest } from '~/lib/types'

export const useLogin = () => {
  const { toast } = useToast()
  const firestore = useFirestore()
  const auth = useAuth()
  return useMutation({
    mutationFn: async (data: TSignInRequest) => {
      if (!auth || !firestore) {
        throw new Error('Firebase is not initialized.')
      }
      const { email, password } = data

      // Sign in with email and password
      const result = await signInWithEmailAndPassword(auth, email, password)
      const user = result.user

      if (user) {
        // Check if user exists in Firestore
        const ref = doc(firestore, 'users', user.uid)
        const snap = await getDoc(ref)
        const userData = snap.data()

        // Update the email in Firestore if it's different
        if (userData && user.email && userData.email !== user.email) {
          return await updateDoc(ref, {
            email,
            updatedAt: new Date(),
          })
        }
      }
    },
    onError: (error: unknown) => {
      let message = String(error)
      if (error instanceof FirebaseError) {
        message =
          authError.find((item) => item.code === error.code)?.message ||
          error.message
      }
      toast({
        description: message,
        variant: 'destructive',
      })
    },
  })
}
