import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'

type TFirebaseContextValue = {
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

const FirebaseContext = createContext<TFirebaseContextValue | undefined>(
  undefined,
)

const FirebaseProvider = (properties: PropsWithChildren) => {
  const { children } = properties
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const value = {
    isLoading,
    setIsLoading,
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}

const useFirebase = () => {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider')
  }
  return context
}

export { FirebaseProvider, useFirebase }
