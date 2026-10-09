import { useState } from 'react'
import { useRevalidator } from 'react-router'

import { login } from '~/apis/firestore/user'
import { TSignInRequest } from '~/lib/types/user'
import { getErrorMessage } from '~/lib/utils/firebase-error'

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
