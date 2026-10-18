import { useCallback, useEffect, useState } from 'react'

import {
  findUnreadableForOthers,
  shareUnencrypted,
} from '~/apis/firestore/shared-document'
import { getErrorMessage } from '~/lib/utils/firebase-error'
import { setUnreadableCount } from '~/lib/utils/unreadable-check'

import { useUserData } from './use-get-user'
import { toast } from './use-toast'

type TItems = Awaited<ReturnType<typeof findUnreadableForOthers>>

// The owner's encrypted items that someone they share with can't read (that
// person turned encryption off), and storing those plain, if the owner
// chooses to.
export const useUnreadableShared = (isEnabled: boolean) => {
  const [items, setItems] = useState<TItems>([])
  const [isPending, setIsPending] = useState(false)
  const { data: userData } = useUserData()
  const uid = userData?.uid

  // Also keeps the count the notifications show up to date.
  const show = useCallback(
    (found: TItems) => {
      setItems(found)
      if (uid) setUnreadableCount(uid, found.length)
    },
    [uid],
  )

  const load = useCallback(async () => {
    try {
      show(await findUnreadableForOthers())
    } catch {
      setItems([])
    }
  }, [show])

  useEffect(() => {
    if (!isEnabled) return
    void findUnreadableForOthers()
      .then(show)
      .catch(() => setItems([]))
  }, [isEnabled, show])

  const shareThem = async () => {
    setIsPending(true)
    try {
      await shareUnencrypted(items)
      await load()
      return true
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { items, isPending, shareThem }
}
