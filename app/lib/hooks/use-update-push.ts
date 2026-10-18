import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deletePushToken, savePushToken } from '~/apis/firestore/push-token'
import {
  isPushSupported,
  readSavedPushToken,
  subscribeToPush,
  unsubscribeFromPush,
} from '~/apis/push'
import { getErrorMessage } from '~/lib/utils/firebase-error'
import { readHideDetails, saveHideDetails } from '~/lib/utils/push-device'

import { toast } from './use-toast'

// unsupported: this browser can't get push (or the app isn't set up for
// it); blocked: the person refused the permission in the browser.
export type TPushStatus = 'loading' | 'unsupported' | 'blocked' | 'off' | 'on'

const currentStatus = async (): Promise<TPushStatus> => {
  if (!(await isPushSupported())) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  return readSavedPushToken() && Notification.permission === 'granted'
    ? 'on'
    : 'off'
}

// Push notifications on this device: turning them on asks for the browser's
// permission (only when the person presses the switch) and files this
// device's token on their profile; turning them off removes it. Hiding
// details keeps items' titles out of this device's notifications.
export const useUpdatePush = () => {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<TPushStatus>('loading')
  const [isPending, setIsPending] = useState(false)
  const [hideDetails, setHideDetails] = useState(false)

  useEffect(() => {
    void currentStatus()
      .catch((): TPushStatus => 'unsupported')
      .then(setStatus)
    void readHideDetails()
      .catch(() => false)
      .then(setHideDetails)
  }, [])

  const changeHideDetails = async (isHidden: boolean) => {
    setHideDetails(isHidden)
    try {
      await saveHideDetails(isHidden)
    } catch (error: unknown) {
      setHideDetails(!isHidden)
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    }
  }

  const enable = async () => {
    setIsPending(true)
    try {
      const token = await subscribeToPush()
      if (token) {
        await savePushToken(token, i18n.language === 'id' ? 'id' : 'en')
        toast({ description: t('settings.push.toast.on') })
      }
      setStatus(await currentStatus())
    } catch (error: unknown) {
      await unsubscribeFromPush()
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    } finally {
      setIsPending(false)
    }
  }

  const disable = async () => {
    setIsPending(true)
    try {
      const token = readSavedPushToken()
      if (token) await deletePushToken(token)
      await unsubscribeFromPush()
      setStatus(await currentStatus())
    } catch (error: unknown) {
      toast({ variant: 'destructive', description: getErrorMessage(error) })
    } finally {
      setIsPending(false)
    }
  }

  return {
    status,
    isPending,
    enable,
    disable,
    hideDetails,
    changeHideDetails,
  }
}
