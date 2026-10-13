import { doc, onSnapshot } from 'firebase/firestore'

import { firestore } from '~/lib/configs/firebase'
import { TAppConfig } from '~/lib/types/config'

// The app-wide settings, live, readable signed in or not. Missing or
// unreadable settings count as none: the app keeps working.
export const subscribeToAppConfig = (onData: (config: TAppConfig) => void) => {
  if (!firestore) {
    onData({})
    return () => {}
  }
  return onSnapshot(
    doc(firestore, 'config', 'app'),
    (snap) => onData((snap.data() as TAppConfig | undefined) ?? {}),
    () => onData({}),
  )
}
