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
import { Toaster } from '~/components/base/toaster'
import { ThemeHead } from '~/components/layouts/theme-head'
import { publicPages } from '~/lib/configs/page'
import { useFirebase } from '~/lib/contexts/firebase'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useIsStandalone } from '~/lib/hooks/use-install-app'
import { middleware } from '~/lib/utils/middleware'

export const Rootlayout = (properties: PropsWithChildren) => {
  const { children } = properties
  const location = useLocation()
  const { isLoading } = useFirebase()
  const { data: user, isLoading: userIsLoading } = useAuthUser()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const isStandalone = useIsStandalone()
  const path = location.pathname.replace(/(.)\/+$/, '$1')
  // The installed app never shows the landing page; it redirects from it.
  const isLeavingLanding = isStandalone && path === '/'

  useEffect(() => {
    if (userIsLoading) return
    middleware({ user, navigate, location, isStandalone })
  }, [user, userIsLoading, navigate, location, isStandalone])

  return (
    <html
      lang={i18n.language}
      dir={i18n.dir()}
      // The theme script below sets the class before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <ThemeHead />
        <Meta />
        <Links />
      </head>
      <body>
        {isLeavingLanding ||
        (!publicPages.has(path) && (isLoading || userIsLoading)) ? (
          <LoadingSpinner />
        ) : (
          children
        )}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
