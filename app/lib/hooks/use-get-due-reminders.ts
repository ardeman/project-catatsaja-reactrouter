import { useMemo } from 'react'

import { today } from '~/lib/utils/finance'
import { periodStats } from '~/lib/utils/health'
import { dueReminders } from '~/lib/utils/health-reminders'

import { useGetHealthLogs } from './use-get-health-logs'
import { useUserData } from './use-get-user'

// How many health reminders are due now, in the logs the person can add to
// (their own, or shared with them to edit): shown on the menu.
export const useGetDueReminders = () => {
  const { data: logs } = useGetHealthLogs()
  const { data: userData } = useUserData()
  const uid = userData?.uid

  return useMemo(() => {
    const now = today()
    const counts = (logs ?? [])
      .filter(
        (log) =>
          (log.owner === uid ||
            !!(uid && log.permissions?.write.includes(uid))) &&
          (log.reminders?.length ?? 0) > 0,
      )
      .map((log) => ({
        id: log.id,
        count: dueReminders({
          reminders: log.reminders ?? [],
          entries: log.content ?? [],
          today: now,
          nextPeriodStart: periodStats(log.content ?? [], now)?.nextStart,
        }).length,
      }))
    return counts.reduce((sum, { count }) => sum + count, 0)
  }, [logs, uid])
}
