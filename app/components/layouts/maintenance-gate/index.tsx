import { LucideIcon, RefreshCw, Wrench } from 'lucide-react'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSelector } from '~/components/base/language-selector'
import { Logo } from '~/components/base/logo'
import { Button } from '~/components/ui/button'
import { appVersion } from '~/lib/constants/app-version'
import { useGetAppConfig } from '~/lib/hooks/use-get-app-config'

const Screen = ({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: ReactNode
}) => (
  <div
    role="status"
    className="flex flex-1 items-center justify-center p-4 md:p-8"
  >
    <section className="glass-surface relative grid w-full max-w-md justify-items-center gap-3 rounded-2xl border p-6 text-center">
      <div className="absolute top-3 right-3">
        <LanguageSelector />
      </div>
      <span className="relative">
        <Logo className="size-14 rounded-2xl" />
        <span className="absolute -right-2 -bottom-2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Icon
            aria-hidden="true"
            className="size-4"
          />
        </span>
      </span>
      {children}
    </section>
  </div>
)

// While maintenance mode is on (`config/app`, README → Deployment), the
// signed-in app and the sign-in pages show this instead, so nobody works in
// an app that is being changed under them. The public pages stay up. An app
// older than `minAppVersion` asks to reload instead, so it can't write data
// in a format the new version has moved on from.
export const MaintenanceGate = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation()
  const { data: config } = useGetAppConfig()

  if (config.maintenance) {
    const until = config.until?.seconds
      ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(config.until.seconds * 1000))
      : undefined
    return (
      <Screen icon={Wrench}>
        <h1 className="text-lg font-semibold">{t('maintenance.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('maintenance.description')}
        </p>
        {config.message && <p className="text-sm">{config.message}</p>}
        {until && (
          <p className="text-xs text-muted-foreground">
            {t('maintenance.until', { time: until })}
          </p>
        )}
      </Screen>
    )
  }

  if ((config.minAppVersion ?? 0) > appVersion)
    return (
      <Screen icon={RefreshCw}>
        <h1 className="text-lg font-semibold">{t('update.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('update.description')}
        </p>
        <Button
          type="button"
          onClick={() => location.reload()}
        >
          {t('update.reload')}
        </Button>
      </Screen>
    )

  return children
}
