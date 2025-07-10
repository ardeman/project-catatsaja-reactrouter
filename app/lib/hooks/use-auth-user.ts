import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'

import { auth } from '~/lib/configs/firebase'

export const useAuthUser = () => {
  const [data, setData] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setData(currentUser)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { data, isLoading }
}
