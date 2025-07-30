import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deleteCurrency } from '~/apis/firestore/currency'
import { useToast } from '~/lib/hooks/use-toast'

export const useDeleteCurrency = () => {
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const mutate = async (id: string) => {
    setIsPending(true)
    try {
      await deleteCurrency(id)
      toast({
        description: t('settings.manageCurrencies.toast.deleted'),
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting currency:', error)
      toast({
        description: t('settings.manageCurrencies.toast.deleteError'),
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
