import { User } from 'firebase/auth'
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'

type AppContextValue = {
  user: User | undefined
  setUser: Dispatch<SetStateAction<User | undefined>>
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const AppProvider = (props: PropsWithChildren) => {
  const { children } = props
  const [user, setUser] = useState<User | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within a AppProvider')
  }
  return context
}

export { useApp, AppProvider }
