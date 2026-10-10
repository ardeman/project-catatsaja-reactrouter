import { useEffect, useState } from 'react'

import { auth } from '~/lib/configs/firebase'
import { TLiveSubscription } from '~/lib/types/common'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

// Shared lifecycle for live reads. Closing a page while auth is loading must
// never start a listener after its cleanup has already run.
export const useLiveData = <T>(
  subscribe: TLiveSubscription<T>,
  emptyData?: T,
  enabled = true,
) => {
  const [data, setData] = useState<T>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!enabled) {
      setData(emptyData)
      setIsLoading(false)
      return
    }
    let isCurrent = true
    let unsubscribe: (() => void) | undefined
    setData(undefined)
    setIsLoading(true)
    const receive = (value: T | undefined) => {
      if (!isCurrent) return
      setData(value)
      setIsLoading(false)
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
  }, [subscribe, emptyData, enabled])

  return { data, isLoading }
}
