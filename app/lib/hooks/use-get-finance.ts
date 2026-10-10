import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TFinanceResponse } from '~/lib/types/finance'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetFinance = (id?: string) => {
  const [data, setData] = useState<TFinanceResponse>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firestore || !id) {
      setData(undefined)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const database = firestore
    let unsubscribe: () => void

    const listen = async () => {
      const user = auth?.currentUser ?? (await waitForAuth())
      if (!user) {
        setData(undefined)
        setIsLoading(false)
        return
      }
      const reference = doc(database, 'finances', id)
      unsubscribe = onSnapshot(
        reference,
        (snap) => {
          if (snap.exists()) {
            const financeData = snap.data()
            setData({
              ...financeData,
              id: snap.id,
              isPinned: financeData.pinnedBy?.includes(user.uid),
            } as TFinanceResponse)
          } else {
            setData(undefined)
          }
          setIsLoading(false)
        },
        () => {
          setData(undefined)
          setIsLoading(false)
        },
      )
    }

    void listen()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [id])

  return { data, isLoading }
}
