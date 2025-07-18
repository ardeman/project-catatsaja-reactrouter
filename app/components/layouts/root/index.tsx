import { PropsWithChildren, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from 'react-router'

import { LoadingSpinner } from '~/components/base/loading-spinner'
import { Toaster } from '~/components/ui/toaster'
import { useFirebase } from '~/lib/contexts/firebase'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { middleware } from '~/lib/utils/middleware'

export const Rootlayout = (properties: PropsWithChildren) => {
  const { children } = properties
  const location = useLocation()
  const { isLoading } = useFirebase()
  const { data: user, isLoading: userIsLoading } = useAuthUser()
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (userIsLoading) return
    middleware({ user, navigate, location })
  }, [user, userIsLoading, navigate, location])

  return (
    <html
      lang={i18n.language}
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
