import { useQuery } from '@tanstack/react-query'

import { fetchUsersByEmail } from '~/apis/firestore'
import { auth } from '~/lib/configs'

export const useSearchUsers = (email: string) => {
  return useQuery({
    queryKey: ['search-users', email],
    queryFn: () => fetchUsersByEmail(email),
    enabled: !!auth?.currentUser && !!email, // Only run the query if the user is authenticated and email is provided
  })
}
