import { useQuery } from '@tanstack/react-query'
import { onAuthStateChanged, User } from 'firebase/auth'

import { auth } from '~/lib/configs/firebase'

export const useAuthUser = () => {
  return useQuery<User | null>({
    queryKey: ['auth-user'],
    queryFn: () =>
      new Promise<User | null>((resolve) => {
        if (!auth) {
          resolve(null)
          return
        }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          resolve(currentUser) // Resolve the current user or null
        })

        // Cleanup the listener when the query is no longer needed
        return () => unsubscribe()
      }),
    staleTime: Infinity,
  })
}
