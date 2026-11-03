import { doc, onSnapshot } from 'firebase/firestore'

import { firestore } from '~/lib/configs/firestore'
import { TAppConfig } from '~/lib/types/config'
import { signingOut } from '~/lib/utils/signing-out'

// The app-wide settings, live, readable signed in or not. Missing or
// unreadable settings count as none: the app keeps working. While signing
// out the connection is closed, and a gate mounted then (the sign-in page)
// must not listen on it: the page reloads anyway.
export const subscribeToAppConfig = (onData: (config: TAppConfig) => void) => {
  if (!firestore || signingOut()) {
    onData({})
    return () => {}
  }
  return onSnapshot(
    doc(firestore, 'config', 'app'),
    (snap) => onData((snap.data() as TAppConfig | undefined) ?? {}),
    () => onData({}),
  )
}
