import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useAuth, useFirestore } from 'reactfire'

import { authError } from '~/lib/constants'
import { useToast } from '~/lib/hooks'

export const useLoginGoogle = () => {
  const { toast } = useToast()
  const provider = new GoogleAuthProvider()
  const firestore = useFirestore()
  const auth = useAuth()
  return useMutation({
    mutationFn: async () => {
      if (!auth || !firestore) {
        throw new Error('Firebase is not initialized.')
      }

      // Sign in with Google
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      if (user) {
        // Check if user exists in Firestore
        const ref = doc(firestore, 'users', user.uid)
        const snap = await getDoc(ref)

        // If user data doesn't exist, store it
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL || '',
            createdAt: new Date(),
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
