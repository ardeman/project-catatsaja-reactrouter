import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react'

export type Theme = 'system' | 'light' | 'dark'
export type Size = 'small' | 'medium' | 'large'

type ThemeProviderProperties = {
  children: ReactNode
  defaultTheme?: Theme
  defaultSize?: Size
  themeStorageKey?: string
  sizeStorageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  size: Size
  setTheme: (theme: Theme) => void
  setSize: (size: Size) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  size: 'medium',
  setTheme: () => null,
  setSize: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const ThemeProvider = ({
  children,
  defaultTheme = 'system',
  defaultSize = 'medium',
  themeStorageKey = 'vite-ui-theme',
  sizeStorageKey = 'tailwind-size',
  ...properties
}: ThemeProviderProperties) => {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(themeStorageKey) as Theme) || defaultTheme,
  )
  const [size, setSizeState] = useState<Size>(
    () => (localStorage.getItem(sizeStorageKey) as Size) || defaultSize,
  )

  useEffect(() => {
    const root = globalThis.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = globalThis.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const root = globalThis.document.documentElement
    let value = '100%'
    if (size === 'small') value = '87.5%'
    else if (size === 'large') value = '112.5%'
    root.style.setProperty('--base-size', value)
    root.dataset.size = size
  }, [size])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(themeStorageKey, newTheme)
    setThemeState(newTheme)
  }

  const setSize = (newSize: Size) => {
    localStorage.setItem(sizeStorageKey, newSize)
    setSizeState(newSize)
  }

  const value = {
    theme,
    size,
    setTheme,
    setSize,
  }

  return (
    <ThemeProviderContext.Provider
      {...properties}
      value={value}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
