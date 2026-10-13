import { useEffect, useState } from 'react'

import { fetchUsersByEmail } from '~/apis/firestore/user'
import { auth } from '~/lib/configs/firebase'
import { TUserResponse } from '~/lib/types/user'
import { getErrorMessage } from '~/lib/utils/firebase-error'

export const useSearchUsers = (email: string) => {
  const [data, setData] = useState<TUserResponse[]>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  // A new email starts as not searched yet (no results, no error), set while
  // rendering so the previous search's results never show for it, and
  // "nobody found" shows only once the search is done.
  const [searchedEmail, setSearchedEmail] = useState(email)
  if (email !== searchedEmail) {
    setSearchedEmail(email)
    setData(undefined)
    setError(undefined)
  }

  useEffect(() => {
    if (!email) return
    let isCurrent = true
    const load = async () => {
      if (!auth?.currentUser) {
        setIsLoading(false)
        return
      }
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

  // No email: nothing to search for.
  return email
    ? { data, isLoading, error }
    : { data: [], isLoading: false, error: undefined }
}
