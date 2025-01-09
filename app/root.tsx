import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from 'react-router'

import { Rootlayout } from '~/components/layouts/root'
import { FirebaseProvider } from '~/lib/contexts/firebase'
import { ThemeProvider } from '~/lib/contexts/theme'

import '~/styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {},
  },
})

export const handle = {
  i18n: 'common',
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>
        <ThemeProvider>
          <Rootlayout>
            <Outlet />
          </Rootlayout>
        </ThemeProvider>
      </FirebaseProvider>
    </QueryClientProvider>
  )
}

export { meta, links } from '~/lib/constants/metadata'

export default App
