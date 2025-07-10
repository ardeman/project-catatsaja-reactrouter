import { FirebaseError } from 'firebase/app'
import { GoogleAuthProvider, linkWithPopup } from 'firebase/auth'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { auth } from '~/lib/configs/firebase'
import { authError } from '~/lib/constants/firebase'

import { toast } from './use-toast'

export const useLinkGoogle = () => {
  const provider = new GoogleAuthProvider()
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutate = async () => {
    setIsPending(true)
    setIsError(false)
    try {
      if (!auth?.currentUser) {
        throw new Error('No user is currently signed in.')
      }
      await linkWithPopup(auth.currentUser, provider)
      toast({
        description: t('auth.toast.linkGoogle'),
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
