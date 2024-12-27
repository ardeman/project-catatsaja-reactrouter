import { useQuery } from '@tanstack/react-query'

import { fetchUserData } from '~/apis/firestore'
import { auth } from '~/lib/configs'

// Custom hook to fetch current user data
export const useUserData = () => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: fetchUserData,
    enabled: !!auth?.currentUser, // Only run the query if the user is authenticated
  })
}
