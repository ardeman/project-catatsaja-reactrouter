import { subscribeToCurrencies } from '~/apis/firestore/currency'
import { TCurrency } from '~/lib/types/settings'

import { useLiveData } from './use-live-data'

const EMPTY: TCurrency[] = []

export const useGetCurrencies = () => useLiveData(subscribeToCurrencies, EMPTY)
