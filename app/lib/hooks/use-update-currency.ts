import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { updateCurrency } from '~/apis/firestore/currency'
import { useToast } from '~/lib/hooks/use-toast'
import { TUpdateCurrencyRequest } from '~/lib/types/settings'

export const useUpdateCurrency = () => {
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const mutate = async (data: TUpdateCurrencyRequest) => {
    setIsPending(true)
    try {
      await updateCurrency(data.id, data)
      toast({
        description: t('settings.manageCurrencies.toast.updated'),
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating currency:', error)
      toast({
        description: t('settings.manageCurrencies.toast.updateError'),
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
