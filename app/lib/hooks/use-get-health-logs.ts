import { subscribeToHealthLogs } from '~/apis/firestore/health-log'
import { THealthLogResponse } from '~/lib/types/health'

import { useLiveData } from './use-live-data'

const EMPTY: THealthLogResponse[] = []

export const useGetHealthLogs = () => useLiveData(subscribeToHealthLogs, EMPTY)
