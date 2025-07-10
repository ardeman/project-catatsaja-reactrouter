import { useEffect, useState } from 'react'

import { fetchUsersByEmail } from '~/apis/firestore/user'
import { auth } from '~/lib/configs/firebase'
import { TUserResponse } from '~/lib/types/user'

export const useSearchUsers = (email: string) => {
  const [data, setData] = useState<TUserResponse[]>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!auth?.currentUser || !email) return
      setIsLoading(true)
      const result = await fetchUsersByEmail(email)
      setData(result)
      setIsLoading(false)
    }
    load()
  }, [email])

  return { data, isLoading }
}
