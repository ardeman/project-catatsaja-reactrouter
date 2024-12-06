import { User } from 'firebase/auth'
import { doc } from 'firebase/firestore'
import { createContext, PropsWithChildren, useContext } from 'react'
import {
  useFirestore,
  useFirestoreDocData,
  useUser as useUserAuth,
} from 'reactfire'

type UserContextValue = {
  user: User | null
  loading: boolean
  error: Error | undefined
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

const UserProvider = (props: PropsWithChildren) => {
  const { children } = props
  const firestore = useFirestore()
  const { data: authData, status: authStatus, error: authError } = useUserAuth()
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }

  const userRef = authData?.uid ? doc(firestore, 'users', authData.uid) : null
  const {
    data: firestoreData,
    status: firestoreStatus,
    error: firestoreError,
  } = useFirestoreDocData(userRef || doc(firestore, 'users', 'dummy'), {
    idField: 'uid',
  })

  return (
    <UserContext.Provider
      value={{
        user: authData?.uid ? (firestoreData as User) : null,
        loading: firestoreStatus === 'loading' || authStatus === 'loading',
        error: firestoreError || authError,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export { useUser, UserProvider }
