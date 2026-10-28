import { Bell, BellRing, LockKeyhole, RefreshCw, Sparkles } from 'lucide-react'
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
import { useGetNewReleases } from '~/lib/hooks/use-get-new-releases'
import { useGetNewVersion } from '~/lib/hooks/use-get-new-version'
import { useGetPendingInvitations } from '~/lib/hooks/use-get-pending-invitations'
import { useGetUnreadableCount } from '~/lib/hooks/use-get-unreadable-count'
import { useSyncPushToken } from '~/lib/hooks/use-sync-push-token'
import { useSyncReminderPush } from '~/lib/hooks/use-sync-reminder-push'
import { useUpdateSeenRelease } from '~/lib/hooks/use-update-seen-release'
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
// reminders due, encrypted items someone they share with can't read, a
// newer version of the app and what's new in it. Everything is worked out on
// the device from what the app already has, and leaves the list once it's
// dealt with; only the newest release seen is saved, on the profile. Use it
// once: the bell (wide screens) and the account sheet (phones) take it.
export const useNotifications = () => {
  const { t } = useTranslation()
  useSyncPushToken()
  useSyncReminderPush()
  const newReleases = useGetNewReleases()
  const { mutate: markSeen } = useUpdateSeenRelease()
  // Hidden at once: offline, the save only finishes once back online.
  const [seen, setSeen] = useState<string>()
  const latestRelease =
    newReleases.latest === seen ? undefined : newReleases.latest
  const { invitations, owners } = useGetPendingInvitations()
  const reminders = useGetDueReminders()
  const unreadableCount = useGetUnreadableCount()
  const hasNewVersion = useGetNewVersion()
  const count =
    invitations.length +
    reminders.count +
    (unreadableCount > 0 ? 1 : 0) +
    (hasNewVersion ? 1 : 0) +
    (latestRelease ? 1 : 0)
  const label =
    count > 0
      ? `${t('notifications.title')}: ${t('notifications.count', { count })}`
      : t('notifications.title')
  const dismissReleases = () => {
    if (!latestRelease) return
    setSeen(latestRelease)
    void markSeen(latestRelease)
  }
  return {
    count,
    label,
    newReleases,
    latestRelease,
    dismissReleases,
    invitations,
    owners,
    reminders,
    unreadableCount,
    hasNewVersion,
  }
}

type TNotifications = ReturnType<typeof useNotifications>

export const NotificationCount = (properties: { count: number }) => {
  const { count } = properties
  if (count === 0) return
  return (
    <span
      aria-hidden="true"
      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] leading-none font-semibold text-white ring-2 ring-background"
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

export const NotificationList = (properties: {
  notifications: TNotifications
  onClose: () => void
}) => {
  const {
    notifications: {
      count,
      newReleases,
      latestRelease,
      dismissReleases,
      invitations,
      owners,
      reminders,
      unreadableCount,
      hasNewVersion,
    },
    onClose: close,
  } = properties
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'id' ? 'id' : 'en'

  return (
    <>
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
      {latestRelease && (
        <Section title={t('notifications.releases.title')}>
          <li className={rowClassName}>
            <Sparkles
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            <div className="grid min-w-0 flex-1 basis-48 gap-0.5 text-sm">
              {newReleases.releases.map((release) => (
                <p key={`${release.date}/${release.title.en}`}>
                  {release.title[language]}
                </p>
              ))}
              {newReleases.more > 0 && (
                <p className="text-muted-foreground">
                  {t('notifications.releases.more', {
                    count: newReleases.more,
                  })}
                </p>
              )}
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissReleases}
              >
                {t('notifications.releases.dismiss')}
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
              >
                <Link
                  to={`/changelog#release-${latestRelease}`}
                  onClick={() => {
                    dismissReleases()
                    close()
                  }}
                >
                  {t('notifications.releases.open')}
                </Link>
              </Button>
            </div>
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
                  {log.doses.map(({ medication, date, time }) => (
                    <span
                      key={`${medication.id}-${date}-${time}`}
                      className="text-muted-foreground"
                    >
                      {t('health.medications.dueNotice', {
                        medicine: [medication.name, medication.dose]
                          .filter(Boolean)
                          .join(' '),
                        time,
                      })}
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
    </>
  )
}

// The bell, on wide screens.
export const Notifications = (properties: {
  notifications: TNotifications
}) => {
  const { notifications } = properties
  const [open, setOpen] = useState(false)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label={notifications.label}
          title={notifications.label}
          className="relative shrink-0 rounded-full"
        >
          <Bell aria-hidden="true" />
          <NotificationCount count={notifications.count} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="glass-surface grid max-h-[min(32rem,calc(100dvh-5rem))] w-[min(26rem,calc(100vw-2rem))] gap-4 overflow-y-auto rounded-xl p-4"
      >
        <NotificationList
          notifications={notifications}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
