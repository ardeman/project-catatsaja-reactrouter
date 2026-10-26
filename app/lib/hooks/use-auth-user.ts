import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'

import { auth } from '~/lib/configs/firebase'
import { signingOut } from '~/lib/utils/signing-out'

export const useAuthUser = () => {
  const [data, setData] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // The page reloads at the sign-in page itself.
      if (signingOut()) return
      setData(currentUser)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { data, isLoading }
}
