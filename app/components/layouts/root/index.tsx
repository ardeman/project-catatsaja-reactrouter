import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from '@remix-run/react'
import clsx from 'clsx'
import { PropsWithChildren, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { LoadingSpinner } from '~/components/base'
import { Toaster } from '~/components/ui'
import { useFirebase, useTheme } from '~/lib/contexts'
import { useAuthUser } from '~/lib/hooks'
import { middleware } from '~/lib/utils'

export const Rootlayout = (props: PropsWithChildren) => {
  const { children } = props
  const { pathname } = useLocation()
  const { isLoading } = useFirebase()
  const { data: user, isLoading: userIsLoading } = useAuthUser()
  const [theme] = useTheme()
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (userIsLoading) return
    middleware({ user, navigate, pathname })
  }, [user, userIsLoading, navigate, pathname])

  return (
    <html
      lang="en"
      className={clsx(theme)}
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
        {isLoading || userIsLoading ? <LoadingSpinner /> : children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
