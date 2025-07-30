import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createCurrency } from '~/apis/firestore/currency'
import { useToast } from '~/lib/hooks/use-toast'
import { TCreateCurrencyRequest } from '~/lib/types/settings'

export const useCreateCurrency = () => {
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const mutate = async (data: TCreateCurrencyRequest) => {
    setIsPending(true)
    try {
      await createCurrency(data)
      toast({
        description: t('settings.manageCurrencies.toast.created'),
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating currency:', error)
      toast({
        description: t('settings.manageCurrencies.toast.createError'),
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
