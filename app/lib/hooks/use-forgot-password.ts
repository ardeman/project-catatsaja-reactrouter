import { FirebaseError } from 'firebase/app'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { auth } from '~/lib/configs/firebase'
import { authError } from '~/lib/constants/firebase'
import { toast } from '~/lib/hooks/use-toast'
import { TEmailRequest } from '~/lib/types/user'

export const useForgotPassword = () => {
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutate = async (data: TEmailRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized.')
      }
      await sendPasswordResetEmail(auth, data.email)
      toast({
        description: t('auth.toast.resetPassword'),
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
