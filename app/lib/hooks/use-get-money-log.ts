import { useQuery } from '@tanstack/react-query'

import { fetchLogs } from '~/apis/firestore/money-log'
import { auth } from '~/lib/configs/firebase'

export const useGetMoneyLog = (id: string) => {
  return useQuery({
    queryKey: ['money-log', id],
    queryFn: () => fetchLogs(id),
    enabled: !!auth?.currentUser,
  })
}
