import {
  collection,
  FieldPath,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TNoteResponse } from '~/lib/types/note'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetNotes = () => {
  const [data, setData] = useState<TNoteResponse[]>()
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

      const notesQuery = query(
        collection(database, 'notes'),
        where(new FieldPath('permissions', 'read'), 'array-contains', user.uid),
      )

      unsubscribe = onSnapshot(notesQuery, (snap) => {
        const result = snap.docs.map((document) => {
          const noteData = document.data()
          return {
            ...noteData,
            id: document.id,
            isPinned: noteData.pinnedBy?.includes(user.uid),
          } as TNoteResponse
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
