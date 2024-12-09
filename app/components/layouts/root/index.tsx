import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useLocation,
} from '@remix-run/react'
import clsx from 'clsx'
import { PropsWithChildren, useEffect } from 'react'
import { useSigninCheck } from 'reactfire'

import { LoadingSpinner } from '~/components/base'
import { Toaster } from '~/components/ui'
import { useApp, useTheme } from '~/lib/contexts'
import { middleware } from '~/lib/utils'

export const Rootlayout = (props: PropsWithChildren) => {
  const { children } = props
  const { loading, setLoading } = useApp()
  const { pathname } = useLocation()
  const [theme] = useTheme()
  const { status, data: signinResult } = useSigninCheck()
  const { signedIn, user } = signinResult

  useEffect(() => {
    if (loading) return
    middleware({ pathname, signedIn })
  }, [user, loading, pathname, signedIn])

  useEffect(() => {
    setLoading(status === 'loading')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

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
        {loading ? <LoadingSpinner /> : children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
