import { FirebaseError } from 'firebase/app'
import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { login } from '~/apis/firestore/user'
import { authError } from '~/lib/constants/firebase'
import { TSignInRequest } from '~/lib/types/user'

import { toast } from './use-toast'

export const useLogin = () => {
  const { revalidate } = useRevalidator()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async (data: TSignInRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      await login(data)
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
