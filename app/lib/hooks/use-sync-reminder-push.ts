import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { syncPushSchedule, TPushReminder } from '~/apis/firestore/push-schedule'
import { THealthLogResponse } from '~/lib/types/health'
import { periodStats } from '~/lib/utils/health'
import { reminderPushAt, reminderStatus } from '~/lib/utils/health-reminders'
import { isFinished, upcomingDoses } from '~/lib/utils/medication-schedule'

import { useClock } from './use-clock'
import { useGetHealthLogs } from './use-get-health-logs'
import { useUserData } from './use-get-user'

const languages = ['en', 'id'] as const

// A day and time in this device's time zone, in milliseconds.
const timeOf = ({ date, time }: { date: string; time: string }) =>
  new Date(`${date}T${time}:00`).getTime()

// Keeps the push notifications of the health logs the person can edit in
// step with their reminders and medicines (`push-schedule.ts`): on start,
// after each change (once things settle) and each new day, as the times
// look ahead from today. Logs this device can't read are left alone.
export const useSyncReminderPush = () => {
  const { i18n } = useTranslation()
  const { data: logs } = useGetHealthLogs()
  const { data: userData } = useUserData()
  const { today } = useClock()
  const uid = userData?.uid

  useEffect(() => {
    if (!uid || !logs || logs.length === 0) return
    const remindersOf = (log: THealthLogResponse): TPushReminder[] => {
      const now = new Date().toTimeString().slice(0, 5)
      // In both languages: each device gets its own.
      const texts = (
        key: string,
        values: (lng: (typeof languages)[number]) => Record<string, string>,
      ) =>
        Object.fromEntries(
          languages.map((lng) => [
            lng,
            i18n.t(key, {
              ...values(lng),
              lng,
              interpolation: { escapeValue: false },
            }),
          ]),
        ) as TPushReminder['text']
      const nextPeriodStart = periodStats(log.content ?? [], today)?.nextStart
      const doses = log.doseLog ?? []
      return [
        ...(log.reminders ?? []).map((reminder) => {
          const status = reminderStatus({
            reminder,
            entries: log.content ?? [],
            today,
            nextPeriodStart,
          })
          const at = reminderPushAt({ reminder, status, today, now })
          return {
            id: reminder.id,
            kind: 'reminder' as const,
            times: at ? [timeOf(at)] : [],
            text: texts('settings.push.sealed.reminder', (lng) => ({
              name: log.name,
              reminder: i18n.t(`health.reminders.due.kind.${reminder.kind}`, {
                lng,
              }),
            })),
          }
        }),
        ...(log.medications ?? []).map((medication) => ({
          id: medication.id,
          kind: 'medicine' as const,
          times: isFinished(medication, doses, today)
            ? []
            : upcomingDoses({ medication, doses, today, now }).map((dose) =>
                timeOf(dose),
              ),
          text: texts('settings.push.sealed.medicine', () => ({
            name: log.name,
            medicine: [medication.name, medication.dose]
              .filter(Boolean)
              .join(' '),
          })),
        })),
      ]
    }
    const timer = setTimeout(() => {
      const sync = async () => {
        for (const log of logs) {
          if (log.owner !== uid && !log.permissions?.write.includes(uid))
            continue
          try {
            await syncPushSchedule(log, remindersOf(log))
          } catch {
            // Offline or refused: tried again on the next change or start.
          }
        }
      }
      void sync()
    }, 3000)
    return () => clearTimeout(timer)
  }, [logs, uid, today, i18n])
}
