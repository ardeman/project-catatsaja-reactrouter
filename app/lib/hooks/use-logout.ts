import { FirebaseError } from 'firebase/app'
import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { auth } from '~/lib/configs/firebase'
import { authError } from '~/lib/constants/firebase'

import { toast } from './use-toast'

export const useLogout = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async () => {
    setIsPending(true)
    setIsError(false)
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized.')
      }
      await signOut(auth)
      revalidate()
    } catch (error: unknown) {
      setIsError(true)
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
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending, isError }
}
