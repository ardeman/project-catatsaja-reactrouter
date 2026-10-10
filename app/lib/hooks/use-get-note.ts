import { useCallback } from 'react'

import { subscribeToNote } from '~/apis/firestore/note'
import { TLiveSubscription } from '~/lib/types/common'
import { TNoteResponse } from '~/lib/types/note'

import { useLiveData } from './use-live-data'

export const useGetNote = (id?: string) => {
  const subscribe = useCallback<TLiveSubscription<TNoteResponse | undefined>>(
    (uid, onData, onError) => subscribeToNote(id!, uid, onData, onError),
    [id],
  )
  return useLiveData(subscribe, undefined, !!id)
}
