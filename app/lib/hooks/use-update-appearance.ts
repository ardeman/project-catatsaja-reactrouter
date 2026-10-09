import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { updateAppearance } from '~/apis/firestore/user'
import { TUpdateAppearanceRequest } from '~/lib/types/settings'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateAppearance = () => {
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutate = async (data: TUpdateAppearanceRequest) => {
    setIsPending(true)
    setIsError(false)
    setIsSuccess(false)
    try {
      await updateAppearance(data)
      toast({
        description: t('settings.appearance.toast.updated'),
      })
      setIsSuccess(true)
      revalidate()
      return true
    } catch (error: unknown) {
      setIsError(true)
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

  return { mutate, isPending, isError, isSuccess }
}
