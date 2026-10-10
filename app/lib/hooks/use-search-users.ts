import { useEffect, useState } from 'react'

import { fetchUsersByEmail } from '~/apis/firestore/user'
import { auth } from '~/lib/configs/firebase'
import { TUserResponse } from '~/lib/types/user'
import { getErrorMessage } from '~/lib/utils/firebase-error'

export const useSearchUsers = (email: string) => {
  const [data, setData] = useState<TUserResponse[]>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    setError(undefined)
    if (!auth?.currentUser || !email) {
      setData([])
      setIsLoading(false)
      return
    }
    let isCurrent = true
    const load = async () => {
      setData([])
      setIsLoading(true)
      try {
        const result = await fetchUsersByEmail(email)
        if (isCurrent) setData(result)
      } catch (error) {
        if (isCurrent) {
          setData([])
          setError(getErrorMessage(error))
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }
    void load()
    return () => {
      isCurrent = false
    }
  }, [email])

  return { data, isLoading, error }
}
