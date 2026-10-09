import { useTranslation } from 'react-i18next'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

import { LoadingSpinner } from '~/components/base/loading-spinner'
import { Rootlayout } from '~/components/layouts/root'
import { ThemeHead } from '~/components/layouts/theme-head'
import { FirebaseProvider } from '~/lib/contexts/firebase'
import { ThemeProvider } from '~/lib/contexts/theme'

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

// Shown while the app starts. It runs outside ThemeProvider, so the saved
// theme and size come from the script in ThemeHead, not from React.
export const HydrateFallback = () => {
  const { i18n } = useTranslation()

  return (
    <html
      lang={i18n.language}
      dir={i18n.dir()}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <ThemeHead />
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
