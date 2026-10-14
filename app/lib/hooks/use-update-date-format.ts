import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { updateDateFormat } from '~/apis/firestore/user'
import { TDateFormat } from '~/lib/types/date'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUpdateDateFormat = () => {
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutate = async (data: TDateFormat) => {
    setIsPending(true)
    setIsError(false)
    setIsSuccess(false)
    try {
      await updateDateFormat(data)
      toast({
        description: t('settings.dateFormat.toast.updated'),
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
