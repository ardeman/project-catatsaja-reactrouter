import { signOut } from 'firebase/auth'
import { useState } from 'react'

import { clearOfflineData } from '~/apis/firestore/cache'
import { auth } from '~/lib/configs/firebase'
import { clearAllDrafts } from '~/lib/utils/drafts'
import { endSession } from '~/lib/utils/encryption-session'
import { getErrorMessage } from '~/lib/utils/firebase-error'

import { toast } from './use-toast'

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
