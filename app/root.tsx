import { Outlet } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Theme } from 'remix-themes'

import { Rootlayout } from '~/components/layouts'
import { FirebaseProvider, ThemeProvider } from '~/lib/contexts'

import '~/styles/globals.css'

const queryClient = new QueryClient()

const App = () => {
  const theme = globalThis.localStorage.getItem('theme')

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>
        <ThemeProvider specifiedTheme={theme as Theme}>
          <Rootlayout>
            <Outlet />
          </Rootlayout>
        </ThemeProvider>
      </FirebaseProvider>
    </QueryClientProvider>
  )
}

export { meta, links } from '~/lib/constants'

export default App
