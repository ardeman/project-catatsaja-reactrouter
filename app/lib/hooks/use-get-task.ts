import { useCallback } from 'react'

import { subscribeToTask } from '~/apis/firestore/task'
import { TLiveSubscription } from '~/lib/types/common'
import { TTaskResponse } from '~/lib/types/task'

import { useLiveData } from './use-live-data'

export const useGetTask = (id?: string) => {
  const subscribe = useCallback<TLiveSubscription<TTaskResponse | undefined>>(
    (uid, onData, onError) => subscribeToTask(id!, uid, onData, onError),
    [id],
  )
  return useLiveData(subscribe, undefined, !!id)
}
