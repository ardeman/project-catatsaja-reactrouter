import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TNoteResponse } from '~/lib/types/note'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetNote = (id?: string) => {
  const [data, setData] = useState<TNoteResponse>()
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
      const reference = doc(database, 'notes', id)
      unsubscribe = onSnapshot(
        reference,
        (snap) => {
          if (snap.exists()) {
            const noteData = snap.data()
            setData({
              ...noteData,
              id: snap.id,
              isPinned: noteData.pinnedBy?.includes(user.uid),
            } as TNoteResponse)
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
