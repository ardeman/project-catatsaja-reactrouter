import type { FirebaseApp } from 'firebase/app'
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check'

import { firebase as app, useEmulators } from '~/lib/configs/firebase'
import { environment } from '~/lib/utils/environment'

// App Check: only this app (on its own domain) may call the services it is
// enforced for in the console (AI Logic; Firestore and Authentication are
// monitored). Firestore and AI Logic take the app from here, so it starts
// before their first request, but not on the public pages, which then don't
// load reCAPTCHA. Enforcing it for Authentication would need it back in
// `firebase.ts`, before sign-in's first request. In development a debug token
// is printed to the console, to register there.
//
// The app is exported from what starts App Check, not passed through: with
// `"sideEffects": false` in package.json, a plain re-export skips this module.
const startAppCheck = (firebase: FirebaseApp) => {
  const appCheckSiteKey = environment.VITE_APP_CHECK_SITE_KEY
  if (!appCheckSiteKey || useEmulators) return firebase
  try {
    if (import.meta.env.DEV)
      Object.assign(globalThis, { FIREBASE_APPCHECK_DEBUG_TOKEN: true })
    initializeAppCheck(firebase, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing App Check:', error)
  }
  return firebase
}

export const firebase = app ? startAppCheck(app) : null
