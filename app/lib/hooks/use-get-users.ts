import { useEffect, useState } from 'react'

import { fetchUsersByIds } from '~/apis/firestore/user'
import { TUserResponse } from '~/lib/types/user'

export const useGetUsers = (uids: string[]) => {
  const [data, setData] = useState<TUserResponse[]>()
  const [isLoading, setIsLoading] = useState(true)
  const key = [...uids].toSorted((a, b) => a.localeCompare(b)).join(',')

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (ids.length === 0) {
      setData([])
      setIsLoading(false)
      return
    }
    let isCurrent = true
    const load = async () => {
      setIsLoading(true)
      try {
        const result = await fetchUsersByIds(ids)
        if (isCurrent) setData(result)
      } catch {
        if (isCurrent) setData([])
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }
    void load()
    return () => {
      isCurrent = false
    }
  }, [key])

  return { data, isLoading }
}
