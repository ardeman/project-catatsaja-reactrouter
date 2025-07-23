import {
  collection,
  FieldPath,
  getDocs,
  limit,
  orderBy,
  where,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TNoteResponse } from '~/lib/types/note'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetNotesPaginated = (pageSize = 10) => {
  const [data, setData] = useState<TNoteResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastDocument, setLastDocument] =
    useState<QueryDocumentSnapshot<DocumentData>>()
  const [hasMore, setHasMore] = useState(true)

  const loadMore = useCallback(async () => {
    if (!firestore || !hasMore) return
    const user = auth?.currentUser ?? (await waitForAuth())
    if (!user) {
      setData([])
      setIsLoading(false)
      setHasMore(false)
      return
    }

    setIsLoading(true)

    let notesQuery = query(
      collection(firestore, 'notes'),
      where(new FieldPath('permissions', 'read'), 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    )

    if (lastDocument) {
      notesQuery = query(notesQuery, startAfter(lastDocument))
    }

    const snap = await getDocs(notesQuery)
    const result = snap.docs.map((document) => {
      const noteData = document.data()
      return {
        ...noteData,
        id: document.id,
        isPinned: noteData.pinnedBy?.includes(user.uid),
      } as TNoteResponse
    })

    if (snap.docs.length < pageSize) {
      setHasMore(false)
    }

    if (snap.docs.length > 0) {
      setLastDocument(snap.docs.at(-1))
    }

    setData((current) => [...current, ...result])
    setIsLoading(false)
  }, [lastDocument, pageSize, hasMore])

  useEffect(() => {
    void loadMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, isLoading, loadMore, hasMore }
}
