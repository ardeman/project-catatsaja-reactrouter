import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react'

import { themeColors } from '~/lib/constants/metadata'

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

const readStorage = (key: string) =>
  typeof localStorage === 'undefined'
    ? undefined
    : localStorage.getItem(key) || undefined

export const ThemeProvider = ({
  children,
  defaultTheme = 'system',
  defaultSize = 'medium',
  themeStorageKey = 'vite-ui-theme',
  sizeStorageKey = 'tailwind-size',
  ...properties
}: ThemeProviderProperties) => {
  // The landing page is rendered at build time, where there is no storage.
  const [theme, setThemeState] = useState<Theme>(
    () => (readStorage(themeStorageKey) as Theme | undefined) || defaultTheme,
  )
  const [size, setSizeState] = useState<Size>(
    () => (readStorage(sizeStorageKey) as Size | undefined) || defaultSize,
  )

  useEffect(() => {
    const query = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved =
        theme === 'system' ? (query.matches ? 'dark' : 'light') : theme
      const root = globalThis.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
      // The browser and installed-app bars follow the app's theme.
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', themeColors[resolved])
    }
    apply()
    // In "system" mode, follow the device when it switches.
    if (theme !== 'system') return
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
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
