import { Outlet } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FirebaseAppProvider } from 'reactfire'
import { Theme } from 'remix-themes'

import { Rootlayout } from '~/components/layouts'
import { firebaseConfig } from '~/lib/configs'
import { AppProvider, FirebaseProvider, ThemeProvider } from '~/lib/contexts'

import '~/styles/globals.css'

const queryClient = new QueryClient()

const App = () => {
  const theme = globalThis.localStorage.getItem('theme')

  return (
    <AppProvider>
      <FirebaseAppProvider firebaseConfig={firebaseConfig}>
        <FirebaseProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider specifiedTheme={theme as Theme}>
              <Rootlayout>
                <Outlet />
              </Rootlayout>
            </ThemeProvider>
          </QueryClientProvider>
        </FirebaseProvider>
      </FirebaseAppProvider>
    </AppProvider>
  )
}

export { meta, links } from '~/lib/constants'

export default App
