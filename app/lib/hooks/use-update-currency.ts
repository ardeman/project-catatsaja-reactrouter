import { useState } from 'react'

import { updateCurrency } from '~/apis/firestore/currency'
import { useToast } from '~/lib/hooks/use-toast'
import { TUpdateCurrencyRequest } from '~/lib/types/settings'

export const useUpdateCurrency = () => {
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()

  const mutate = async (data: TUpdateCurrencyRequest) => {
    setIsPending(true)
    try {
      await updateCurrency(data.id, data)
      toast({
        title: 'Success',
        description: 'Currency updated successfully.',
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating currency:', error)
      toast({
        title: 'Error',
        description: 'Failed to update currency.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
