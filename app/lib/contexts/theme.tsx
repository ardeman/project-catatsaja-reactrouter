import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react'
import { Theme, themes, ThemeMetadata } from 'remix-themes'
import { ThemeProviderProps } from 'remix-themes/build/theme-provider'
import { useBroadcastChannel } from 'remix-themes/build/useBroadcastChannel'
import { useCorrectCssTransition } from 'remix-themes/build/useCorrectCssTransition'

type TProperties = Omit<ThemeProviderProps, 'themeAction'> & {
  themeAction?: string
}
type ThemeContextType = [
  Theme | null,
  Dispatch<SetStateAction<Theme | null>>,
  ThemeMetadata,
]
type TDefinedBy = 'USER' | 'SYSTEM'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
ThemeContext.displayName = 'ThemeContext'

const prefersLightMQ = '(prefers-color-scheme: light)'
const getPreferredTheme = (): Theme =>
  globalThis.matchMedia(prefersLightMQ).matches ? Theme.LIGHT : Theme.DARK
const mediaQuery =
  typeof globalThis === 'object' && globalThis?.matchMedia
    ? globalThis.matchMedia(prefersLightMQ)
    : null

export function ThemeProvider(properties: TProperties) {
  const {
    children,
    specifiedTheme,
    themeAction,
    disableTransitionOnThemeChange,
  } = properties
  const ensureCorrectTransition = useCorrectCssTransition({
    disableTransitions: disableTransitionOnThemeChange,
  })
  const [theme, setTheme] = useState<Theme | null>(() => {
    if (specifiedTheme) {
      return themes.includes(specifiedTheme) ? specifiedTheme : null
    }
    if (typeof globalThis !== 'object') return null
    return getPreferredTheme()
  })
  const [themeDefinedBy, setThemeDefinedBy] = useState<TDefinedBy>(
    specifiedTheme ? 'USER' : 'SYSTEM',
  )
  const broadcastThemeChange = useBroadcastChannel<{
    theme: Theme
    definedBy: TDefinedBy
  }>('remix-themes', (event) => {
    ensureCorrectTransition(() => {
      setTheme(event.data.theme)
      setThemeDefinedBy(event.data.definedBy)
    })
  })

  useEffect(() => {
    if (themeDefinedBy === 'USER') {
      return () => {}
    }
    const handleChange = (event: MediaQueryListEvent) => {
      ensureCorrectTransition(() => {
        setTheme(event.matches ? Theme.LIGHT : Theme.DARK)
      })
    }
    mediaQuery?.addEventListener('change', handleChange)
    return () => mediaQuery?.removeEventListener('change', handleChange)
  }, [ensureCorrectTransition, themeDefinedBy])

  const handleThemeChange = useCallback(
    (value: Theme | ((previousTheme: Theme | null) => Theme | null) | null) => {
      const nextTheme = typeof value === 'function' ? value(theme) : value
      if (nextTheme === null) {
        const preferredTheme = getPreferredTheme()
        ensureCorrectTransition(() => {
          setTheme(preferredTheme)
          setThemeDefinedBy('SYSTEM')
          broadcastThemeChange({ theme: preferredTheme, definedBy: 'SYSTEM' })
        })
        if (themeAction) {
          fetch(`${themeAction}`, {
            method: 'POST',
            body: JSON.stringify({ theme: null }),
          })
        }
      } else {
        ensureCorrectTransition(() => {
          setTheme(nextTheme)
          setThemeDefinedBy('USER')
          broadcastThemeChange({ theme: nextTheme, definedBy: 'USER' })
        })
        if (themeAction) {
          fetch(`${themeAction}`, {
            method: 'POST',
            body: JSON.stringify({ theme: nextTheme }),
          })
        }
      }
    },
    [broadcastThemeChange, ensureCorrectTransition, theme, themeAction],
  )

  const value = useMemo(
    () =>
      [
        theme,
        handleThemeChange,
        { definedBy: themeDefinedBy },
      ] as ThemeContextType,
    [theme, handleThemeChange, themeDefinedBy],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const clientThemeCode = String.raw`
(() => {
  const theme = window.matchMedia(${JSON.stringify(prefersLightMQ)}).matches
    ? 'light'
    : 'dark';
  
  const cl = document.documentElement.classList;
  const dataAttr = document.documentElement.dataset.theme;

  if (dataAttr != null) {
    const themeAlreadyApplied = dataAttr === 'light' || dataAttr === 'dark';
    if (!themeAlreadyApplied) {
      document.documentElement.dataset.theme = theme;
    }
  } else {
    const themeAlreadyApplied = cl.contains('light') || cl.contains('dark');
    if (!themeAlreadyApplied) {
      cl.add(theme);
    }
  }
  
  const meta = document.querySelector('meta[name=color-scheme]');
  if (meta) {
    if (theme === 'dark') {
      meta.content = 'dark light';
    } else if (theme === 'light') {
      meta.content = 'light dark';
    }
  }
})();
`

interface PreventFlashOnWrongThemeProperties {
  ssrTheme?: boolean
  nonce?: string
}

export function PreventFlashOnWrongTheme({
  ssrTheme,
  nonce,
}: PreventFlashOnWrongThemeProperties) {
  const [theme] = useTheme()
  return (
    <>
      <meta
        name="color-scheme"
        content={theme === 'light' ? 'light dark' : 'dark light'}
      />
      {ssrTheme ? null : (
        <script
          dangerouslySetInnerHTML={{ __html: clientThemeCode }}
          nonce={nonce}
          suppressHydrationWarning
        />
      )}
    </>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function isTheme(value: string): value is Theme {
  return typeof value === 'string' && themes.includes(value as Theme)
}
