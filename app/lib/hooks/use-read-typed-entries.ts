import { useState } from 'react'

import { readTypedEntries } from '~/apis/ai/entries'
import { TTypedEntries } from '~/lib/types/finance'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

export const useReadTypedEntries = () => {
  const [isPending, setIsPending] = useState(false)

  const mutate = async (data: {
    text: string
    today: string
    weekday: string
  }): Promise<TTypedEntries | undefined> => {
    setIsPending(true)
    try {
      const typed = await readTypedEntries(data)
      if (typed.entries.length === 0) throw new Error('typed/empty')
      return typed
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
