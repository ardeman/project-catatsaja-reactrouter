import { useQuery } from '@tanstack/react-query'

import { fetchNotes } from '~/apis/firestore/note'
import { auth } from '~/lib/configs/firebase'

// Custom hook to fetch current user data
export const useGetNotes = () => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
    enabled: !!auth?.currentUser, // Only run the query if the user is authenticated
  })
}
