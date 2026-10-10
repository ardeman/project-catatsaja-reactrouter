import { subscribeToFinances } from '~/apis/firestore/finance'
import { TFinanceResponse } from '~/lib/types/finance'

import { useLiveData } from './use-live-data'

const EMPTY: TFinanceResponse[] = []

export const useGetFinances = () => useLiveData(subscribeToFinances, EMPTY)
