import { User } from 'firebase/auth'
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'

type UserContextValue = {
  user: User | undefined
  setUser: Dispatch<SetStateAction<User | undefined>>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

const UserProvider = (props: PropsWithChildren) => {
  const { children } = props
  const [user, setUser] = useState<User | undefined>()

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
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
