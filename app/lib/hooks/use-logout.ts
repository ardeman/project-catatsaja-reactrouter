import { signOut } from 'firebase/auth'
import { useState } from 'react'

import { clearOfflineData } from '~/apis/firestore/cache'
import { deletePushToken } from '~/apis/firestore/push-token'
import { readSavedPushToken, unsubscribeFromPush } from '~/apis/push'
import { auth } from '~/lib/configs/firebase'
import { clearAllDrafts } from '~/lib/utils/drafts'
import { endSession } from '~/lib/utils/encryption-session'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

// How long signing out waits for this device's push token to be removed.
const PUSH_TOKEN_WAIT = 3000

const stopPush = async () => {
  const token = readSavedPushToken()
  if (!token) return
  await Promise.race([
    (async () => {
      try {
        await deletePushToken(token)
      } catch {
        // Not removed: the server drops it once it stops working.
      }
    })(),
    new Promise((resolve) => setTimeout(resolve, PUSH_TOKEN_WAIT)),
  ])
  await unsubscribeFromPush()
}

export const useLogout = () => {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const mutate = async () => {
    setIsPending(true)
    setIsError(false)
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized.')
      }
      // This device stops getting the person's notifications: whoever
      // signs in next must turn them on for themselves.
      await stopPush()
      // Forget the unlocked encryption key on this device too, and this
      // device's copies of the person's items and unsaved drafts.
      await endSession()
      await clearOfflineData()
      await signOut(auth)
      clearAllDrafts()
      // The Firestore connection is closed: start the page again.
      location.assign('/auth/sign-in')
    } catch (error: unknown) {
      setIsError(true)
      const message = getErrorMessage(error)
      toast({
        variant: 'destructive',
        description: message,
      })
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending, isError }
}
