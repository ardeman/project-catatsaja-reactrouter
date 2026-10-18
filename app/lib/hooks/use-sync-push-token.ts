import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { deletePushToken, savePushToken } from '~/apis/firestore/push-token'
import {
  isPushSupported,
  readSavedPushToken,
  refreshPushToken,
  unsubscribeFromPush,
} from '~/apis/push'

import { useAuthUser } from './use-auth-user'

// While push is on for this device, files its current token (Cloud Messaging
// renews it from time to time) and the app's language, which the
// notifications are written in, each time the app opens or the language
// changes. A permission taken back in the browser turns push off here too.
export const useSyncPushToken = () => {
  const { i18n } = useTranslation()
  const { data: user } = useAuthUser()
  const lang = i18n.language === 'id' ? 'id' : 'en'
  const uid = user?.uid

  useEffect(() => {
    const saved = readSavedPushToken()
    if (!uid || !saved) return
    const update = async () => {
      if (!(await isPushSupported())) return
      const token = await refreshPushToken()
      if (!token) {
        await deletePushToken(saved)
        await unsubscribeFromPush()
        return
      }
      if (token !== saved) await deletePushToken(saved)
      await savePushToken(token, lang)
    }
    const sync = async () => {
      try {
        await update()
      } catch {
        // Offline or refused: tried again the next time the app opens.
      }
    }
    void sync()
  }, [uid, lang])
}
