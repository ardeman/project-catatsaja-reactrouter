import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createFinance } from '~/apis/firestore/finance'
import { TCreateFinanceRequest } from '~/lib/types/finance'

import { toast } from './use-toast'

export const useCreateFinance = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const { t } = useTranslation()

  const mutate = async (data: TCreateFinanceRequest) => {
    setIsPending(true)
    setIsError(false)
    try {
      const reference = await createFinance(data)
      toast({
        description: t('finances.toast.created'),
      })
      return reference
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
