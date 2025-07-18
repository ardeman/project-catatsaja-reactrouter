import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

import { LoadingSpinner } from '~/components/base/loading-spinner'
import { Rootlayout } from '~/components/layouts/root'
import { FirebaseProvider } from '~/lib/contexts/firebase'
import { ThemeProvider, useTheme } from '~/lib/contexts/theme'

import '~/styles/globals.css'

export const handle = {
  i18n: 'common',
}

const App = () => {
  return (
    <FirebaseProvider>
      <ThemeProvider>
        <Rootlayout>
          <Outlet />
        </Rootlayout>
      </ThemeProvider>
    </FirebaseProvider>
  )
}

export { meta, links } from '~/lib/constants/metadata'

export const HydrateFallback = () => {
  const { i18n } = useTranslation()
  const { theme } = useTheme()
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

  return (
    <html
      lang={i18n.language}
      dir={i18n.dir()}
    >
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <LoadingSpinner />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default App
