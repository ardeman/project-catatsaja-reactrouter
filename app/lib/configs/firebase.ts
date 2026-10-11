import { FirebaseApp, initializeApp } from 'firebase/app'
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check'
import { connectAuthEmulator, getAuth, Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  Firestore,
} from 'firebase/firestore'

import { environment } from '~/lib/utils/environment'

// Development against the local emulators: a `demo-` project id, which can
// never reach a real Firebase project.
const useEmulators =
  import.meta.env.DEV && environment.VITE_USE_EMULATORS === 'true'

const firebaseConfig = {
  apiKey: environment.VITE_FIREBASE_API_KEY,
  authDomain: environment.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: useEmulators
    ? 'demo-catatsaja'
    : environment.VITE_FIREBASE_PROJECT_ID,
  storageBucket: environment.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: environment.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: environment.VITE_FIREBASE_APP_ID,
  measurementId: environment.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase app and services
let firebase: FirebaseApp | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null

// Ensure that Firebase is only initialized on the client side
if (typeof window !== 'undefined') {
  try {
    firebase = initializeApp(firebaseConfig)

    // App Check: only this app (on its own domain) may call Firestore once
    // enforcement is on in the console. Before any request is made. In
    // development a debug token is printed to the console, to register
    // there.
    const appCheckSiteKey = environment.VITE_APP_CHECK_SITE_KEY
    if (appCheckSiteKey && !useEmulators) {
      if (import.meta.env.DEV)
        Object.assign(globalThis, { FIREBASE_APPCHECK_DEBUG_TOKEN: true })
      initializeAppCheck(firebase, {
        provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      })
    }
    auth = getAuth(firebase)
    firestore = getFirestore(firebase)
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
      })
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
    }

    // Async function to initialize Analytics if supported
    const initializeAnalytics = async () => {
      try {
        const { getAnalytics, isSupported } = await import('firebase/analytics')
        const supported = await isSupported()
        if (supported) {
          getAnalytics(firebase!)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error initializing Firebase Analytics:', error)
      }
    }

    if (!useEmulators) void initializeAnalytics() // Call the async function
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing Firebase app:', error)
  }
}

export { auth, firebase, firestore }
