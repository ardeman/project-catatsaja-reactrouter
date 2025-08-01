import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { unlinkFinance } from '~/apis/firestore/finance'
import { TFinanceResponse } from '~/lib/types/finance'

import { toast } from './use-toast'

export const useUnlinkFinance = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const { t } = useTranslation()

  const mutate = async (data: TFinanceResponse) => {
    setIsPending(true)
    setIsError(false)
    try {
      await unlinkFinance(data)
      toast({
        description: t('finances.toast.unlinked'),
      })
    } catch (error: unknown) {
      setIsError(true)
      const message = String(error)
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
