import { FirebaseError } from 'firebase/app'
import { verifyBeforeUpdateEmail } from 'firebase/auth'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { auth } from '~/lib/configs/firebase'
import { authError } from '~/lib/constants/firebase'
import { toast } from '~/lib/hooks/use-toast'
import { TEmailRequest } from '~/lib/types/user'

export const useUpdateEmail = () => {
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutate = async (data: TEmailRequest) => {
    setIsPending(true)
    setIsError(false)
    setIsSuccess(false)
    try {
      if (!auth?.currentUser) {
        throw new Error('No user is currently signed in.')
      }
      await verifyBeforeUpdateEmail(auth.currentUser, data.email)
      toast({
        description: t('auth.toast.updateEmail'),
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
