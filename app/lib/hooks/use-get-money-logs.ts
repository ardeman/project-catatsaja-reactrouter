import { useQuery } from '@tanstack/react-query'

import { fetchMoneyLogs } from '~/apis/firestore/money-log'
import { auth } from '~/lib/configs/firebase'

export const useGetMoneyLogs = () => {
  return useQuery({
    queryKey: ['money-logs'],
    queryFn: fetchMoneyLogs,
    enabled: !!auth?.currentUser,
  })
}
