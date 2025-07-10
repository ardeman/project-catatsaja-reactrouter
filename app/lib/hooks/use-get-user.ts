import { useEffect, useState } from 'react'

import { fetchUserData } from '~/apis/firestore/user'
import { auth } from '~/lib/configs/firebase'
import { TUserResponse } from '~/lib/types/user'

// Custom hook to fetch current user data
export const useUserData = () => {
  const [data, setData] = useState<TUserResponse | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!auth?.currentUser) {
        setIsLoading(false)
        return
      }
      const result = await fetchUserData()
      setData(result)
      setIsLoading(false)
    }
    load()
  }, [])

  return { data, isLoading }
}
