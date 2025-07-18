import { FirebaseError } from 'firebase/app'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { register } from '~/apis/firestore/user'
import { authError } from '~/lib/constants/firebase'
import { TSignUpRequest } from '~/lib/types/user'

import { toast } from './use-toast'

export const useRegister = () => {
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutate = async (data: TSignUpRequest) => {
    setIsPending(true)
    setIsError(false)
    setIsSuccess(false)
    try {
      await register(data)
      toast({
        description: t('auth.toast.emailVerify'),
      })
      setIsSuccess(true)
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

  return { mutate, isPending, isError, isSuccess }
}
