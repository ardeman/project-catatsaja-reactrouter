import { withEntries } from '~/apis/firestore/finance'
import { TFinanceResponse } from '~/lib/types/finance'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// A book with all its entries, read from its months when they aren't at
// hand (lists have only summaries). Undefined, after saying why, when they
// can't be read.
export const useLoadFinanceEntries = () => {
  const mutate = async (finance: TFinanceResponse) => {
    try {
      return await withEntries(finance)
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    }
  }

  return { mutate }
}
