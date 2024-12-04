import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from '@remix-run/react'
import { useEffect } from 'react'
import { useUser } from 'reactfire'

import '~/styles/globals.css'
import { middleware } from './utils'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
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
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

const App = () => {
  const { status, data: user } = useUser()
  const { pathname } = useLocation()

  useEffect(() => {
    if (status !== 'loading') {
      middleware({ pathname, user })
    }
  }, [user, status, pathname])

  return <Outlet />
}

export { meta, links } from '~/constants'

export default App
