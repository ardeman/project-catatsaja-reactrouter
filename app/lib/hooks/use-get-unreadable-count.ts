import { useCallback, useEffect, useSyncExternalStore } from 'react'

import { findUnreadableForOthers } from '~/apis/firestore/shared-document'
import {
  getUnreadableCount,
  isUnreadableCheckDue,
  setUnreadableCount,
  subscribeToUnreadableCount,
} from '~/lib/utils/unreadable-check'

import { useEncryptionSession } from './use-encryption-session'
import { useUserData } from './use-get-user'

// How many of the person's encrypted items someone they share with can't
// read (see `useUnreadableShared`), checked at most once a day.
export const useGetUnreadableCount = () => {
  const { data: userData } = useUserData()
  const session = useEncryptionSession()
  const uid = userData?.uid
  const isEnabled = !!userData?.publicKey && session.status === 'unlocked'

  const getSnapshot = useCallback(
    () => (uid && isEnabled ? getUnreadableCount(uid) : 0),
    [uid, isEnabled],
  )
  const count = useSyncExternalStore(
    subscribeToUnreadableCount,
    getSnapshot,
    () => 0,
  )

  useEffect(() => {
    if (!uid || !isEnabled || !isUnreadableCheckDue(uid)) return
    void findUnreadableForOthers()
      .then((items) => setUnreadableCount(uid, items.length))
      .catch(() => null)
  }, [uid, isEnabled])

  return count
}
