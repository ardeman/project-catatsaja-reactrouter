import { Outlet } from 'react-router'

import { Rootlayout } from '~/components/layouts/root'
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

export default App
