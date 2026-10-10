import { useCallback } from 'react'

import { subscribeToFinance } from '~/apis/firestore/finance'
import { TLiveSubscription } from '~/lib/types/common'
import { TFinanceResponse } from '~/lib/types/finance'

import { useLiveData } from './use-live-data'

export const useGetFinance = (id?: string) => {
  const subscribe = useCallback<
    TLiveSubscription<TFinanceResponse | undefined>
  >(
    (uid, onData, onError) => subscribeToFinance(id!, uid, onData, onError),
    [id],
  )
  return useLiveData(subscribe, undefined, !!id)
}
