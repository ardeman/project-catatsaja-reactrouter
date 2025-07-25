import { createContext, useState, useContext, ReactNode } from 'react'

type TCurrency = {
  code: string
  digits: number
}

type CurrencyProviderProperties = {
  children: ReactNode
  defaultNumberFormat?: string
  defaultCurrencies?: TCurrency[]
  defaultCurrency?: string
  numberFormatStorageKey?: string
  currenciesStorageKey?: string
  defaultCurrencyStorageKey?: string
}

type CurrencyProviderState = {
  numberFormat: string
  currencies: TCurrency[]
  defaultCurrency: string
  setNumberFormat: (format: string) => void
  setCurrencies: (currencies: TCurrency[]) => void
  setDefaultCurrency: (currency: string) => void
}

const initialState: CurrencyProviderState = {
  numberFormat: 'en-US',
  currencies: [],
  defaultCurrency: '',
  setNumberFormat: () => null,
  setCurrencies: () => null,
  setDefaultCurrency: () => null,
}

const CurrencyProviderContext = createContext<CurrencyProviderState>(initialState)

export const CurrencyProvider = ({
  children,
  defaultNumberFormat = 'en-US',
  defaultCurrencies = [],
  defaultCurrency = '',
  numberFormatStorageKey = 'number-format',
  currenciesStorageKey = 'currencies',
  defaultCurrencyStorageKey = 'default-currency',
}: CurrencyProviderProperties) => {
  const [numberFormat, setNumberFormatState] = useState<string>(
    () => localStorage.getItem(numberFormatStorageKey) || defaultNumberFormat,
  )
  const [currencies, setCurrenciesState] = useState<TCurrency[]>(() => {
    const stored = localStorage.getItem(currenciesStorageKey)
    return stored ? JSON.parse(stored) : defaultCurrencies
  })
  const [currentCurrency, setCurrentCurrencyState] = useState<string>(
    () =>
      localStorage.getItem(defaultCurrencyStorageKey) ||
      defaultCurrency ||
      defaultCurrencies[0]?.code ||
      '',
  )

  const setNumberFormat = (format: string) => {
    localStorage.setItem(numberFormatStorageKey, format)
    setNumberFormatState(format)
  }

  const setCurrencies = (list: TCurrency[]) => {
    localStorage.setItem(currenciesStorageKey, JSON.stringify(list))
    setCurrenciesState(list)
  }

  const setDefaultCurrency = (code: string) => {
    localStorage.setItem(defaultCurrencyStorageKey, code)
    setCurrentCurrencyState(code)
  }

  const value: CurrencyProviderState = {
    numberFormat,
    currencies,
    defaultCurrency: currentCurrency,
    setNumberFormat,
    setCurrencies,
    setDefaultCurrency,
  }

  return (
    <CurrencyProviderContext.Provider value={value}>
      {children}
    </CurrencyProviderContext.Provider>
  )
}

export const useCurrency = () => {
  const context = useContext(CurrencyProviderContext)
  if (context === undefined)
    throw new Error('useCurrency must be used within a CurrencyProvider')
  return context
}
