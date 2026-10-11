import { useState } from 'react'

import { readReceipt } from '~/apis/ai/receipt'
import { TReceipt } from '~/lib/types/finance'
import { getErrorMessage } from '~/lib/utils/firebase-error'
import { shrinkImage } from '~/lib/utils/image'

import { toast } from './use-toast'

export const useScanReceipt = () => {
  const [isPending, setIsPending] = useState(false)

  const mutate = async (file: File): Promise<TReceipt | undefined> => {
    setIsPending(true)
    try {
      let image
      try {
        image = await shrinkImage(file)
      } catch {
        throw new Error('image/unreadable')
      }
      const receipt = await readReceipt(image)
      if (receipt.items.length === 0 && receipt.total <= 0)
        throw new Error('receipt/empty')
      return receipt
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      })
      return undefined
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
