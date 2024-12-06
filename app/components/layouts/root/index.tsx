import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useLocation,
} from '@remix-run/react'
import clsx from 'clsx'
import { PropsWithChildren, useEffect } from 'react'
import { useUser } from 'reactfire'

import { LoadingSpinner } from '~/components/base'
import { Toaster } from '~/components/ui'
import { useTheme } from '~/lib/contexts'
import { middleware } from '~/lib/utils'

export const Rootlayout = (props: PropsWithChildren) => {
  const { children } = props
  const { status, data: user } = useUser()
  const { pathname } = useLocation()
  const [theme] = useTheme()

  useEffect(() => {
    if (status !== 'loading') {
      middleware({ pathname, user })
    }
  }, [user, status, pathname])

  return (
    <html
      lang="en"
      className={clsx(theme)}
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
        {status === 'loading' ? <LoadingSpinner classname="flex" /> : children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
