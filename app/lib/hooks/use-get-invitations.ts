import { subscribeToInvitations } from '~/apis/firestore/shared-document'
import { TInvitation } from '~/lib/types/common'

import { useLiveData } from './use-live-data'

const EMPTY: TInvitation[] = []

// Items shared with the person that they haven't accepted yet, live.
export const useGetInvitations = () =>
  useLiveData(subscribeToInvitations, EMPTY)
