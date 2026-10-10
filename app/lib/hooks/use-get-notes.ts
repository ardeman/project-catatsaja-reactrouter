import { subscribeToNotes } from '~/apis/firestore/note'
import { TNoteResponse } from '~/lib/types/note'

import { useLiveData } from './use-live-data'

const EMPTY: TNoteResponse[] = []

export const useGetNotes = () => useLiveData(subscribeToNotes, EMPTY)
