import {
  collection,
  FieldPath,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { useFirebase } from '~/lib/contexts/firebase'
import { TNoteResponse } from '~/lib/types/note'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetNotes = () => {
  const [data, setData] = useState<TNoteResponse[]>()
  const [isLoading, setIsLoading] = useState(true)
  const { setIsLoading: setGlobalLoading } = useFirebase()

  useEffect(() => {
    if (!firestore) return
    const database = firestore
    let unsubscribe: () => void

    const listen = async () => {
      setGlobalLoading(true)
      const user = auth?.currentUser ?? (await waitForAuth())
      if (!user) {
        setData([])
        setIsLoading(false)
        setGlobalLoading(false)
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
        setIsLoading(false)
        setGlobalLoading(false)
      })
    }

    void listen()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [setGlobalLoading])

  return { data, isLoading }
}
