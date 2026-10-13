import { useState } from 'react'

import { moveFinanceEntries } from '~/apis/firestore/finance'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// Moving an open book's entries into month documents, once
// (`moveFinanceEntries`). Until it's done the book stays as it was, so a
// failure (offline) only means trying again next time.
export const useMoveFinanceEntries = () => {
  const [isPending, setIsPending] = useState(false)

  const mutate = async (id: string) => {
    setIsPending(true)
    try {
      await moveFinanceEntries(id)
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
