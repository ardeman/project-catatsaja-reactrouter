import { Bell, BellRing, LockKeyhole, RefreshCw } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { InvitationItem } from '~/components/layouts/invitations'
import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { useGetDueReminders } from '~/lib/hooks/use-get-due-reminders'
import { useGetNewVersion } from '~/lib/hooks/use-get-new-version'
import { useGetPendingInvitations } from '~/lib/hooks/use-get-pending-invitations'
import { useGetUnreadableCount } from '~/lib/hooks/use-get-unreadable-count'
import { cn } from '~/lib/utils/shadcn'

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="grid gap-2">
    <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
    <ul className="grid gap-2">{children}</ul>
  </section>
)

const rowClassName = 'flex flex-wrap items-center gap-3 rounded-lg border p-3'

// What waits for the person, in one place: invitations to answer, health
// reminders due, encrypted items someone they share with can't read, and a
// newer version of the app. Everything is worked out on the device from what
// the app already has, and leaves the list once it's dealt with, so there is
// nothing to mark as read.
export const Notifications = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { invitations, owners } = useGetPendingInvitations()
  const reminders = useGetDueReminders()
  const unreadableCount = useGetUnreadableCount()
  const hasNewVersion = useGetNewVersion()
  const count =
    invitations.length +
    reminders.count +
    (unreadableCount > 0 ? 1 : 0) +
    (hasNewVersion ? 1 : 0)
  const label =
    count > 0
      ? `${t('notifications.title')}: ${t('notifications.count', { count })}`
      : t('notifications.title')
  const close = () => setOpen(false)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label={label}
          title={label}
          className="relative shrink-0 rounded-full"
        >
          <Bell aria-hidden="true" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] leading-none font-semibold text-white ring-2 ring-background"
            >
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="glass-surface grid max-h-[min(32rem,calc(100dvh-5rem))] w-[min(26rem,calc(100vw-2rem))] gap-4 overflow-y-auto rounded-xl p-4"
      >
        <h2 className="text-sm font-semibold">{t('notifications.title')}</h2>
        {count === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('notifications.empty')}
          </p>
        )}
        {hasNewVersion && (
          <Section title={t('notifications.update.title')}>
            <li className={rowClassName}>
              <p className="min-w-0 flex-1 basis-48 text-sm">
                {t('notifications.update.description')}
              </p>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => location.reload()}
              >
                <RefreshCw aria-hidden="true" />
                {t('update.reload')}
              </Button>
            </li>
          </Section>
        )}
        {invitations.length > 0 && (
          <Section title={t('invitations.title')}>
            {invitations.map((invitation) => (
              <li
                key={`${invitation.name}/${invitation.id}`}
                className={rowClassName}
              >
                <InvitationItem
                  invitation={invitation}
                  invitations={invitations}
                  owner={owners?.find((user) => user.uid === invitation.owner)}
                  onAnswered={close}
                />
              </li>
            ))}
          </Section>
        )}
        {reminders.logs.length > 0 && (
          <Section title={t('health.reminders.title')}>
            {reminders.logs.map((log) => (
              <li key={log.id}>
                <Link
                  to={`/health/${log.id}`}
                  onClick={close}
                  className={cn(
                    rowClassName,
                    'flex-nowrap items-start transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                  )}
                >
                  <BellRing
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span className="grid min-w-0 gap-0.5 text-sm">
                    <span className="truncate font-medium">{log.name}</span>
                    {log.reminders.map(({ reminder }) => (
                      <span
                        key={reminder.id}
                        className="text-muted-foreground"
                      >
                        {t(`health.reminders.due.kind.${reminder.kind}`)}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </Section>
        )}
        {unreadableCount > 0 && (
          <Section title={t('notifications.encryption.title')}>
            <li className={rowClassName}>
              <LockKeyhole
                aria-hidden="true"
                className="size-4 shrink-0"
              />
              <p className="min-w-0 flex-1 basis-48 text-sm">
                {t('encryption.settings.unreadable', {
                  count: unreadableCount,
                })}
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="ml-auto"
              >
                <Link
                  to="/settings/account"
                  onClick={close}
                >
                  {t('notifications.encryption.review')}
                </Link>
              </Button>
            </li>
          </Section>
        )}
      </PopoverContent>
    </Popover>
  )
}
