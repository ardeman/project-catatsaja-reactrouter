import { useEffect, useState } from 'react'

import { fetchUsers } from '~/apis/firestore/user'
import { TUserResponse } from '~/lib/types/user'

export const useGetUsers = () => {
  const [data, setData] = useState<TUserResponse[]>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const result = await fetchUsers()
      setData(result)
      setIsLoading(false)
    }
    load()
  }, [])

  return { data, isLoading }
}
