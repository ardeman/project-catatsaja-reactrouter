import { useState } from 'react'

import { createCurrency } from '~/apis/firestore/currency'
import { useToast } from '~/lib/hooks/use-toast'
import { TCreateCurrencyRequest } from '~/lib/types/settings'

export const useCreateCurrency = () => {
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()

  const mutate = async (data: TCreateCurrencyRequest) => {
    setIsPending(true)
    try {
      await createCurrency(data)
      toast({
        title: 'Success',
        description: 'Currency created successfully.',
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating currency:', error)
      toast({
        title: 'Error',
        description: 'Failed to create currency.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
