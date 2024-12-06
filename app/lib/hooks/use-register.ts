import { useNavigate } from '@remix-run/react'
import { useMutation } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useAuth, useFirestore } from 'reactfire'

import { authError } from '~/lib/constants'
import { useToast, useUpdateProfile } from '~/lib/hooks'
import { TSignUpRequest } from '~/lib/types'

export const useRegister = () => {
  const { toast } = useToast()
  const firestore = useFirestore()
  const auth = useAuth()
  const { mutate: mutateUpdateProfile } = useUpdateProfile()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (data: TSignUpRequest) => {
      if (!auth || !firestore) {
        throw new Error('Firebase is not initialized.')
      }
      const { email, password, displayName } = data
      // Create the user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )
      const user = userCredential.user

      if (user) {
        // Update the user's profile with the display name
        await mutateUpdateProfile({
          displayName: displayName,
        })

        // Send email verification
        await sendEmailVerification(user)

        // Store user data in Firestore
        await setDoc(doc(firestore, 'users', user.uid), {
          uid: user.uid,
          displayName: displayName,
          email: email,
          createdAt: new Date(),
        })
      } else {
        throw new Error('No user is currently signed in.')
      }
    },
    onSuccess: () => {
      toast({
        description: 'Please check your email to verify your account.',
      })
      navigate('.', { replace: true })
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
