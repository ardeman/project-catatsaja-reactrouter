import { useQuery } from '@tanstack/react-query'

import { fetchMoneyLogs } from '~/apis/firestore'
import { auth } from '~/lib/configs'

export const useGetMoneyLogs = () => {
  return useQuery({
    queryKey: ['money-logs'],
    queryFn: fetchMoneyLogs,
    enabled: !!auth?.currentUser,
  })
}
