import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { auth } from '~/lib/configs/firebase'
import { getErrorMessage } from '~/lib/utils/firebase-error'

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
      const message = getErrorMessage(error)
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
