import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { useInstallApp } from '~/lib/hooks/use-install-app'
import { useUpdatePush } from '~/lib/hooks/use-update-push'

// Push notifications on this device, for invitations and health reminders.
// The browser asks for the permission only when the person turns them on.
// iPhone and iPad have push only in the installed app. An item's title is
// shown only where the device can open it, unless details are hidden here.
export const Push = () => {
  const { t } = useTranslation()
  const { status, isPending, enable, disable, hideDetails, changeHideDetails } =
    useUpdatePush()
  const { canInstall, steps } = useInstallApp()

  if (status === 'loading') return

  const needsInstall =
    status === 'unsupported' && canInstall && steps === 'appleMobile'

  const message = needsInstall
    ? 'settings.push.needsInstall'
    : (`settings.push.${status}` as const)

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('settings.push.title')}</CardTitle>
        <CardDescription>{t('settings.push.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p
          role="status"
          className="text-sm"
        >
          {t(message)}
        </p>
        {(status === 'on' || status === 'off') && (
          <Button
            containerClassName="w-full sm:w-fit"
            variant={status === 'on' ? 'outline' : 'default'}
            onClick={status === 'on' ? disable : enable}
            isLoading={isPending}
            disabled={isPending}
          >
            {t(
              status === 'on'
                ? 'settings.push.turnOff'
                : 'settings.push.turnOn',
            )}
          </Button>
        )}
        {status === 'on' && (
          <div className="flex items-start gap-2">
            <Checkbox
              id="push-hide-details"
              checked={hideDetails}
              onCheckedChange={(checked) =>
                void changeHideDetails(checked === true)
              }
            />
            <Label
              htmlFor="push-hide-details"
              className="text-sm leading-snug font-normal"
            >
              {t('settings.push.hideDetails')}
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
