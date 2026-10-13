import { Wrench } from 'lucide-react'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Logo } from '~/components/base/logo'
import { useGetAppConfig } from '~/lib/hooks/use-get-app-config'

// While maintenance mode is on (`config/app`, README → Deployment), the
// signed-in app and the sign-in pages show this instead, so nobody works in
// an app that is being changed under them. The public pages stay up.
export const MaintenanceGate = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation()
  const { data: config } = useGetAppConfig()

  if (!config.maintenance) return children

  const until = config.until?.seconds
    ? new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(config.until.seconds * 1000))
    : undefined

  return (
    <div
      role="status"
      className="flex flex-1 items-center justify-center p-4 md:p-8"
    >
      <section className="glass-surface grid w-full max-w-md justify-items-center gap-3 rounded-2xl border p-6 text-center">
        <span className="relative">
          <Logo className="size-14 rounded-2xl" />
          <span className="absolute -right-2 -bottom-2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Wrench
              aria-hidden="true"
              className="size-4"
            />
          </span>
        </span>
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
      </section>
    </div>
  )
}
