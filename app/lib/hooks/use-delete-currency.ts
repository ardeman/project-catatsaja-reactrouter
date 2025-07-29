import { useState } from 'react'

import { deleteCurrency } from '~/apis/firestore/currency'
import { useToast } from '~/lib/hooks/use-toast'

export const useDeleteCurrency = () => {
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()

  const mutate = async (id: string) => {
    setIsPending(true)
    try {
      await deleteCurrency(id)
      toast({
        title: 'Success',
        description: 'Currency deleted successfully.',
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting currency:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete currency.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
