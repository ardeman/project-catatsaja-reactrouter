import { subscribeToBlocked } from '~/apis/firestore/blocked'

import { useLiveData } from './use-live-data'

const EMPTY: string[] = []

// The ids of the people the person blocked, live.
export const useGetBlocked = () => useLiveData(subscribeToBlocked, EMPTY)
