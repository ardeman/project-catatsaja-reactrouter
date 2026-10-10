import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { unlinkHealthLog } from '~/apis/firestore/health-log'
import { THealthLogResponse } from '~/lib/types/health'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useUnlinkHealthLog = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const { t } = useTranslation()

  const mutate = async (data: THealthLogResponse) => {
    setIsPending(true)
    setIsError(false)
    try {
      await unlinkHealthLog(data)
      toast({
        description: t('health.toast.unlinked'),
      })
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
