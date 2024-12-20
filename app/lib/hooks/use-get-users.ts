import { useQuery } from '@tanstack/react-query'

import { fetchUsers } from '~/apis/firestore'

export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    retry: false,
  })
}
