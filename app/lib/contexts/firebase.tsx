import { getAuth } from 'firebase/auth'
import {
  enableIndexedDbPersistence,
  initializeFirestore,
} from 'firebase/firestore'
import { PropsWithChildren, useEffect } from 'react'
import {
  AuthProvider,
  FirestoreProvider,
  useFirebaseApp,
  useInitFirestore,
} from 'reactfire'

import { useApp } from '~/lib/contexts'

export const FirebaseProvider = (props: PropsWithChildren) => {
  const { children } = props
  const app = useFirebaseApp()
  const { setLoading } = useApp()

  const authInstance = getAuth(app)
  const { status, data: firestoreInstance } = useInitFirestore(async (app) => {
    const db = initializeFirestore(app, {})
    await enableIndexedDbPersistence(db)
    return db
  })

  useEffect(() => {
    setLoading(status === 'loading')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <AuthProvider sdk={authInstance}>
      <FirestoreProvider sdk={firestoreInstance}>{children}</FirestoreProvider>
    </AuthProvider>
  )
}
