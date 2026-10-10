import { useCallback } from 'react'

import { subscribeToHealthLog } from '~/apis/firestore/health-log'
import { TLiveSubscription } from '~/lib/types/common'
import { THealthLogResponse } from '~/lib/types/health'

import { useLiveData } from './use-live-data'

export const useGetHealthLog = (id?: string) => {
  const subscribe = useCallback<
    TLiveSubscription<THealthLogResponse | undefined>
  >(
    (uid, onData, onError) => subscribeToHealthLog(id!, uid, onData, onError),
    [id],
  )
  return useLiveData(subscribe, undefined, !!id)
}
