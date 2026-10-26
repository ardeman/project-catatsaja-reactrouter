import { useMemo } from 'react'

import { periodStats } from '~/lib/utils/health'
import { dueReminders, isReminderFor } from '~/lib/utils/health-reminders'
import { isFinished, waitingDoses } from '~/lib/utils/medication-schedule'

import { useClock } from './use-clock'
import { useGetHealthLogs } from './use-get-health-logs'
import { useUserData } from './use-get-user'

// The health reminders due now and the medicine doses waiting to be
// marked, in the logs the person can add to (their own, or shared with them
// to edit): shown on the menu and in the notifications.
export const useGetDueReminders = () => {
  const { data: logs } = useGetHealthLogs()
  const { data: userData } = useUserData()
  const uid = userData?.uid
  const { today, now } = useClock()

  return useMemo(() => {
    const due = (logs ?? [])
      .filter(
        (log) =>
          (log.owner === uid ||
            !!(uid && log.permissions?.write.includes(uid))) &&
          ((log.reminders?.length ?? 0) > 0 ||
            (log.medications?.length ?? 0) > 0),
      )
      .map((log) => {
        const nextPeriodStart = periodStats(log.content ?? [], today)?.nextStart
        const doses = log.doseLog ?? []
        return {
          id: log.id,
          name: log.name,
          nextPeriodStart,
          reminders: dueReminders({
            reminders: (log.reminders ?? []).filter((reminder) =>
              isReminderFor(reminder, log.owner === uid),
            ),
            entries: log.content ?? [],
            today,
            nextPeriodStart,
          }),
          doses: waitingDoses({
            medications: (log.medications ?? []).filter(
              (medication) => !isFinished(medication, doses, today),
            ),
            doses,
            today,
            now,
          }),
        }
      })
      .filter((log) => log.reminders.length > 0 || log.doses.length > 0)
    const count = due.reduce(
      (sum, log) => sum + log.reminders.length + log.doses.length,
      0,
    )
    return { count, logs: due }
  }, [logs, uid, today, now])
}
