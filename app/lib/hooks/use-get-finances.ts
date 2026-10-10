import {
  collection,
  FieldPath,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TFinanceResponse } from '~/lib/types/finance'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetFinances = () => {
  const [data, setData] = useState<TFinanceResponse[]>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firestore) return
    const database = firestore
    let unsubscribe: () => void

    const listen = async () => {
      const user = auth?.currentUser ?? (await waitForAuth())
      if (!user) {
        setData([])
        setIsLoading(false)
        return
      }

      const financesQuery = query(
        collection(database, 'finances'),
        where(new FieldPath('permissions', 'read'), 'array-contains', user.uid),
      )

      unsubscribe = onSnapshot(
        financesQuery,
        (snap) => {
          const result = snap.docs.map((document) => {
            const financeData = document.data()
            return {
              ...financeData,
              id: document.id,
              isPinned: financeData.pinnedBy?.includes(user.uid),
            } as TFinanceResponse
          })
          setData(result)
          setIsLoading(false)
        },
        () => {
          setData([])
          setIsLoading(false)
        },
      )
    }

    void listen()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return { data, isLoading }
}
