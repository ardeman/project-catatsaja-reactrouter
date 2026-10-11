import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'

import { AboutFooter } from '~/components/layouts/about-footer'
import { Button } from '~/components/ui/button'
import { appleIcon, appName } from '~/lib/constants/metadata'
import { readStartPage } from '~/lib/constants/navigation'
import { useAuthUser } from '~/lib/hooks/use-auth-user'

export const NotFoundPage = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { data: user } = useAuthUser()
  // Read in effects: browser-only, and the same on the server and the
  // first client render.
  const [startPage, setStartPage] = useState('notes')
  const [canGoBack, setCanGoBack] = useState(false)
  useEffect(() => {
    setStartPage(readStartPage())
    setCanGoBack(globalThis.history.length > 1)
  }, [])

  return (
    <main className="app-background relative flex min-h-dvh w-full flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="glass-surface grid w-full max-w-md justify-items-center gap-6 rounded-2xl border p-6 text-center md:p-10">
          {/* "404" with the app's icon as the zero. */}
          <p
            aria-label="404"
            className="flex items-center gap-2 text-7xl font-extrabold tracking-tight text-primary md:text-8xl"
          >
            <span aria-hidden="true">4</span>
            <img
              src={appleIcon}
              alt=""
              className="size-16 -rotate-12 rounded-2xl shadow-lg md:size-20"
            />
            <span aria-hidden="true">4</span>
          </p>
          <div className="grid gap-2">
            <h1 className="text-2xl font-semibold text-balance">
              {t('notFound.title')}
            </h1>
            <p className="text-balance text-muted-foreground">
              {t('notFound.description')}
            </p>
          </div>
          <code className="max-w-full truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            {pathname}
          </code>
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            {canGoBack && (
              <Button
                variant="outline"
                className="glass-surface gap-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="size-4" />
                {t('notFound.back')}
              </Button>
            )}
            <Button
              asChild
              className="glass-surface glass-primary border"
            >
              <Link to={user ? `/${startPage}` : '/'}>
                {user ? t('notFound.app', { appName }) : t('notFound.home')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <AboutFooter />
    </main>
  )
}
