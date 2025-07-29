import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react'

interface AccountSettingsContextType {
  disabled: boolean
  setDisabled: Dispatch<SetStateAction<boolean>>
}

const AccountSettingsContext = createContext<
  AccountSettingsContextType | undefined
>(undefined)

export const useAccountSettings = () => {
  const context = useContext(AccountSettingsContext)
  if (!context) {
    throw new Error(
      'useAccountSettings must be used within an AccountSettingsProvider',
    )
  }
  return context
}

export const AccountSettingsProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [disabled, setDisabled] = useState(false)

  return (
    <AccountSettingsContext.Provider value={{ disabled, setDisabled }}>
      {children}
    </AccountSettingsContext.Provider>
  )
}
