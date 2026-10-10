import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createHealthLog } from '~/apis/firestore/health-log'
import { TCreateHealthLogRequest } from '~/lib/types/health'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useCreateHealthLog = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const { t } = useTranslation()

  const mutate = async (
    data: TCreateHealthLogRequest,
    message = t('health.toast.created'),
  ) => {
    setIsPending(true)
    setIsError(false)
    try {
      const reference = await createHealthLog(data)
      toast({
        description: message,
      })
      return reference
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
