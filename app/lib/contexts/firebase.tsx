import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { PropsWithChildren } from 'react'
import { AuthProvider, FirestoreProvider, useFirebaseApp } from 'reactfire'

export const FirebaseProvider = (props: PropsWithChildren) => {
  const { children } = props
  const app = useFirebaseApp()

  const firestoreInstance = getFirestore(app)
  const authInstance = getAuth(app)

  return (
    <AuthProvider sdk={authInstance}>
      <FirestoreProvider sdk={firestoreInstance}>{children}</FirestoreProvider>
    </AuthProvider>
  )
}
