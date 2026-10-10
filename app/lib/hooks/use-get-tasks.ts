import { subscribeToTasks } from '~/apis/firestore/task'
import { TTaskResponse } from '~/lib/types/task'

import { useLiveData } from './use-live-data'

const EMPTY: TTaskResponse[] = []

export const useGetTasks = () => useLiveData(subscribeToTasks, EMPTY)
