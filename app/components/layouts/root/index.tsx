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
import { middleware } from '~/lib/utils/middleware'

// Applies the saved theme and text size before the first paint, so pages
// rendered at build time (the landing page) don't flash the wrong theme.
const themeScript = `(() => {
  try {
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

  useEffect(() => {
    if (userIsLoading) return
    middleware({ user, navigate, location })
  }, [user, userIsLoading, navigate, location])

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
        {!publicPages.has(location.pathname.replace(/(.)\/+$/, '$1')) &&
        (isLoading || userIsLoading) ? (
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
