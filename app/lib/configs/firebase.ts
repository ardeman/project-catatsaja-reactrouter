import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'
import { FirebaseApp, initializeApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
}

// Initialize Firebase app and services
let firebase: FirebaseApp | null = null
let analytics: Analytics | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null

// Ensure that Firebase is only initialized on the client side
if (typeof globalThis !== 'undefined') {
  try {
    firebase = initializeApp(firebaseConfig)
    auth = getAuth(firebase)
    firestore = getFirestore(firebase)

    // Async function to initialize Analytics if supported
    const initializeAnalytics = async () => {
      try {
        const supported = await isSupported()
        if (supported) {
          analytics = getAnalytics(firebase!)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error initializing Firebase Analytics:', error)
      }
    }

    initializeAnalytics() // Call the async function
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing Firebase app:', error)
  }
}

export { auth, firestore, analytics }
