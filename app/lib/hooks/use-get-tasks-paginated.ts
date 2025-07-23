import {
  collection,
  FieldPath,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TTaskResponse } from '~/lib/types/task'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetTasksPaginated = (pageSize = 10) => {
  const [data, setData] = useState<TTaskResponse[]>([])
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

    let tasksQuery = query(
      collection(firestore, 'tasks'),
      where(new FieldPath('permissions', 'read'), 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    )

    if (lastDocument) {
      tasksQuery = query(tasksQuery, startAfter(lastDocument))
    }

    const snap = await getDocs(tasksQuery)
    const result = snap.docs.map((document) => {
      const taskData = document.data()
      return {
        ...taskData,
        id: document.id,
        isPinned: taskData.pinnedBy?.includes(user.uid),
      } as TTaskResponse
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
