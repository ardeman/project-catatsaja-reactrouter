import { useMemo } from 'react'

import { today } from '~/lib/utils/finance'
import { periodStats } from '~/lib/utils/health'
import { dueReminders } from '~/lib/utils/health-reminders'

import { useGetHealthLogs } from './use-get-health-logs'
import { useUserData } from './use-get-user'

// The health reminders due now, in the logs the person can add to (their
// own, or shared with them to edit): shown on the menu and in the
// notifications.
export const useGetDueReminders = () => {
  const { data: logs } = useGetHealthLogs()
  const { data: userData } = useUserData()
  const uid = userData?.uid

  return useMemo(() => {
    const now = today()
    const due = (logs ?? [])
      .filter(
        (log) =>
          (log.owner === uid ||
            !!(uid && log.permissions?.write.includes(uid))) &&
          (log.reminders?.length ?? 0) > 0,
      )
      .map((log) => {
        const nextPeriodStart = periodStats(log.content ?? [], now)?.nextStart
        return {
          id: log.id,
          name: log.name,
          nextPeriodStart,
          reminders: dueReminders({
            reminders: log.reminders ?? [],
            entries: log.content ?? [],
            today: now,
            nextPeriodStart,
          }),
        }
      })
      .filter((log) => log.reminders.length > 0)
    const count = due.reduce((sum, log) => sum + log.reminders.length, 0)
    return { count, logs: due }
  }, [logs, uid])
}
