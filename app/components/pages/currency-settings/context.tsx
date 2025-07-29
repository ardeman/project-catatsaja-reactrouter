import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
} from 'react'

interface CurrencySettingsContextType {
  disabled: boolean
  setDisabled: Dispatch<SetStateAction<boolean>>
}

const CurrencySettingsContext = createContext<
  CurrencySettingsContextType | undefined
>(undefined)

export const useCurrencySettings = () => {
  const context = useContext(CurrencySettingsContext)
  if (!context) {
    throw new Error(
      'useCurrencySettings must be used within a CurrencySettingsProvider',
    )
  }
  return context
}

export const CurrencySettingsProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [disabled, setDisabled] = useState(false)

  // Reset disabled state after a delay
  useEffect(() => {
    if (disabled) {
      const timer = setTimeout(() => {
        setDisabled(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [disabled])

  return (
    <CurrencySettingsContext.Provider value={{ disabled, setDisabled }}>
      {children}
    </CurrencySettingsContext.Provider>
  )
}
