import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TTaskResponse } from '~/lib/types/task'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetTask = (id?: string) => {
  const [data, setData] = useState<TTaskResponse>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firestore || !id) return
    const database = firestore
    let unsubscribe: () => void

    const listen = async () => {
      const user = auth?.currentUser ?? (await waitForAuth())
      if (!user) {
        setData(undefined)
        setIsLoading(false)
        return
      }
      const reference = doc(database, 'tasks', id)
      unsubscribe = onSnapshot(reference, (snap) => {
        if (snap.exists()) {
          const taskData = snap.data()
          setData({
            ...taskData,
            id: snap.id,
            isPinned: taskData.pinnedBy?.includes(user.uid),
          } as TTaskResponse)
        } else {
          setData(undefined)
        }
        setIsLoading(false)
      })
    }

    void listen()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [id])

  return { data, isLoading }
}
