import { Outlet } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FirebaseAppProvider } from 'reactfire'
import { Theme } from 'remix-themes'

import { Rootlayout } from '~/components/layouts'
import { firebaseConfig } from '~/configs'
import { FirebaseProvider, ThemeProvider } from '~/contexts'

import '~/styles/globals.css'

const queryClient = new QueryClient()

const App = () => {
  const theme = globalThis.localStorage.getItem('theme')

  return (
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
  )
}

export { meta, links } from '~/constants'

export default App
