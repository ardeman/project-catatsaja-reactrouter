import { useQuery } from '@tanstack/react-query'

import { fetchLogs } from '~/apis/firestore'
import { auth } from '~/lib/configs'

export const useGetMoneyLog = (id: string) => {
  return useQuery({
    queryKey: ['money-log', id],
    queryFn: () => fetchLogs(id),
    enabled: !!auth?.currentUser,
  })
}
