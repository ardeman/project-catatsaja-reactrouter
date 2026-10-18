import { Bell } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LoadingScreen } from '~/components/base/loading-screen'
import { Button } from '~/components/ui/button'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useInstallApp } from '~/lib/hooks/use-install-app'
import { useUpdatePush } from '~/lib/hooks/use-update-push'
import {
  dismissPushPrompt,
  isPushPromptDismissed,
} from '~/lib/utils/push-prompt'

type TPushPromptProperties = { children: ReactNode }

// Asks once per device, after the encryption step, whether to get push
// notifications, so people who never open the settings still hear about
// invitations, reminders and doses. Skipped where the browser can't push
// or the person already answered the browser's own question. On iPhone and
// iPad outside the installed app, it says to install first.
const Ask = ({
  children,
  onDismiss,
}: TPushPromptProperties & { onDismiss: () => void }) => {
  const { t } = useTranslation()
  const { status, isPending, enable } = useUpdatePush()
  const { canInstall, steps } = useInstallApp()

  if (status === 'loading')
    return (
      <LoadingScreen
        isLoading
        classname="min-h-fit flex-1"
      />
    )

  const needsInstall =
    status === 'unsupported' && canInstall && steps === 'appleMobile'
  const canAsk = status === 'off' && Notification.permission === 'default'
  if (!needsInstall && !canAsk) return children

  return (
    <div className="flex flex-1 items-start justify-center p-4 md:items-center md:p-8">
      <section className="glass-surface grid w-full max-w-md gap-4 rounded-2xl border p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Bell className="size-5" />
          </span>
          <div className="grid gap-1">
            <h2 className="font-semibold">{t('pushPrompt.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('settings.push.description')}
            </p>
          </div>
        </div>
        {needsInstall && (
          <p className="text-sm">{t('settings.push.needsInstall')}</p>
        )}
        <div className="grid gap-2">
          {canAsk && (
            <Button
              onClick={() => void enable()}
              disabled={isPending}
            >
              {t('settings.push.turnOn')}
            </Button>
          )}
          <Button
            variant={canAsk ? 'ghost' : 'default'}
            disabled={isPending}
            onClick={onDismiss}
          >
            {t('pushPrompt.later')}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t('pushPrompt.hint')}
          </p>
        </div>
      </section>
    </div>
  )
}

export const PushPrompt = ({ children }: TPushPromptProperties) => {
  const { data: userData } = useUserData()
  const [isDismissed, setIsDismissed] = useState(isPushPromptDismissed)

  if (!userData || isDismissed) return children

  return (
    <Ask
      onDismiss={() => {
        dismissPushPrompt()
        setIsDismissed(true)
      }}
    >
      {children}
    </Ask>
  )
}
