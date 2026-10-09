import {
  createContext,
  useCallback,
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
  // Shown instead of the saved value until cleared (undefined), e.g. while
  // choosing in the settings, without saving it.
  previewTheme: (theme?: Theme) => void
  previewSize: (size?: Size) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  size: 'medium',
  setTheme: () => null,
  setSize: () => null,
  previewTheme: () => null,
  previewSize: () => null,
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
  const [previewedTheme, setPreviewedTheme] = useState<Theme>()
  const [previewedSize, setPreviewedSize] = useState<Size>()
  const [size, setSizeState] = useState<Size>(
    () => (readStorage(sizeStorageKey) as Size | undefined) || defaultSize,
  )

  const activeTheme = previewedTheme ?? theme
  const activeSize = previewedSize ?? size

  useEffect(() => {
    const query = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved =
        activeTheme === 'system'
          ? query.matches
            ? 'dark'
            : 'light'
          : activeTheme
      const root = globalThis.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
      // The browser and installed-app bars follow the app's theme. A new tag
      // instead of a changed one: some browsers (Safari) only repaint the
      // bar for a new tag.
      const color = document.createElement('meta')
      color.name = 'theme-color'
      color.content = themeColors[resolved]
      const current = document.querySelector('meta[name="theme-color"]')
      if (current?.getAttribute('content') !== color.content) {
        if (current) current.replaceWith(color)
        else document.head.append(color)
      }
    }
    apply()
    // In "system" mode, follow the device when it switches.
    if (activeTheme !== 'system') return
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [activeTheme])

  useEffect(() => {
    const root = globalThis.document.documentElement
    let value = '100%'
    if (activeSize === 'small') value = '87.5%'
    else if (activeSize === 'large') value = '112.5%'
    root.style.setProperty('--base-size', value)
    root.dataset.size = activeSize
  }, [activeSize])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(themeStorageKey, newTheme)
      setThemeState(newTheme)
    },
    [themeStorageKey],
  )

  const setSize = useCallback(
    (newSize: Size) => {
      localStorage.setItem(sizeStorageKey, newSize)
      setSizeState(newSize)
    },
    [sizeStorageKey],
  )

  const value = {
    theme,
    size,
    setTheme,
    setSize,
    previewTheme: setPreviewedTheme,
    previewSize: setPreviewedSize,
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
