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
import { publicPages } from '~/lib/configs/page'
import { useFirebase } from '~/lib/contexts/firebase'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useIsStandalone } from '~/lib/hooks/use-install-app'
import { middleware } from '~/lib/utils/middleware'

// Runs before the first paint: the installed app skips the landing page, and
// the saved theme and text size are applied so pages rendered at build time
// (the landing page) don't flash the wrong theme.
const themeScript = `(() => {
  try {
    // The installed app has no landing page: leave it before it paints.
    const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
    if (installed && location.pathname === '/') {
      location.replace('/notes')
      return
    }
    const theme = localStorage.getItem('vite-ui-theme') || 'system'
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.add(dark ? 'dark' : 'light')
    const size = localStorage.getItem('tailwind-size')
    const sizes = { small: '87.5%', large: '112.5%' }
    if (sizes[size]) document.documentElement.style.setProperty('--base-size', sizes[size])
  } catch {}
})()`

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
          content="width=device-width, initial-scale=1"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
