import { verifyBeforeUpdateEmail } from 'firebase/auth'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { auth } from '~/lib/configs/firebase'
import { toast } from '~/lib/hooks/use-toast'
import { TEmailRequest } from '~/lib/types/user'
import { getErrorMessage } from '~/lib/utils/firebase-error'

export const useUpdateEmail = () => {
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)

  const mutate = async (data: TEmailRequest) => {
    setIsPending(true)
    try {
      if (!auth?.currentUser) {
        throw new Error('No user is currently signed in.')
      }
      await verifyBeforeUpdateEmail(auth.currentUser, data.email)
      toast({
        description: t('auth.toast.updateEmail'),
      })
      revalidate()
      return true
    } catch (error: unknown) {
      const message = getErrorMessage(error)
      toast({
        variant: 'destructive',
        description: message,
      })
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
