import {
  collection,
  FieldPath,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TTaskResponse } from '~/lib/types/task'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetTasks = () => {
  const [data, setData] = useState<TTaskResponse[]>()
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

      const tasksQuery = query(
        collection(database, 'tasks'),
        where(new FieldPath('permissions', 'read'), 'array-contains', user.uid),
      )

      unsubscribe = onSnapshot(tasksQuery, (snap) => {
        const result = snap.docs.map((document) => {
          const taskData = document.data()
          return {
            ...taskData,
            id: document.id,
            isPinned: taskData.pinnedBy?.includes(user.uid),
          } as TTaskResponse
        })
        setData(result)
      })
    }

    void listen()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return { data, isLoading }
}
