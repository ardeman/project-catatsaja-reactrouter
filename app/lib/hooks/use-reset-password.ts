import { sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { auth } from '~/lib/configs/firebase'
import { toast } from '~/lib/hooks/use-toast'
import { getErrorMessage } from '~/lib/utils/firebase-error'

export const useResetPassword = () => {
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutate = async () => {
    setIsPending(true)
    setIsError(false)
    setIsSuccess(false)
    try {
      if (!auth?.currentUser?.email) {
        throw new Error('No user is currently signed in.')
      }
      await sendPasswordResetEmail(auth, auth.currentUser.email)
      toast({
        description: t('auth.toast.resetPassword'),
      })
      setIsSuccess(true)
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

  return { mutate, isPending, isError, isSuccess }
}
