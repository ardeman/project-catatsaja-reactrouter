import { useEffect, useState } from 'react'

import { auth } from '~/lib/configs/firebase'
import { TLiveSubscription } from '~/lib/types/common'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

// Shared lifecycle for live reads. Closing a page while auth is loading must
// never start a listener after its cleanup has already run.
export const useLiveData = <T>(
  subscribe: TLiveSubscription<T>,
  emptyData?: T,
  isEnabled = true,
) => {
  // What the current subscription last delivered. Until it delivers (a new
  // id, say), the hook is loading: an earlier subscription's data is never
  // shown for it.
  const [received, setReceived] = useState<{
    subscribe: TLiveSubscription<T>
    data: T | undefined
  }>()

  useEffect(() => {
    if (!isEnabled) return
    let isCurrent = true
    let unsubscribe: (() => void) | undefined
    const receive = (value: T | undefined) => {
      if (!isCurrent) return
      setReceived({ subscribe, data: value })
    }
    const listen = async () => {
      try {
        const user = auth?.currentUser ?? (await waitForAuth())
        if (!isCurrent) return
        if (!user) {
          receive(emptyData)
          return
        }
        unsubscribe = subscribe(user.uid, receive, () => receive(emptyData))
      } catch {
        receive(emptyData)
      }
    }
    void listen()
    return () => {
      isCurrent = false
      unsubscribe?.()
    }
  }, [subscribe, emptyData, isEnabled])

  if (!isEnabled) return { data: emptyData, isLoading: false }
  return received?.subscribe === subscribe
    ? { data: received.data, isLoading: false }
    : { data: undefined, isLoading: true }
}
