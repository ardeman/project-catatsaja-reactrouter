import { TFunction } from 'i18next'

import { THealthEntry } from '~/lib/types/health'
import { cycleToday } from '~/lib/utils/cycle-calendar'
import { entriesOf, periodStats } from '~/lib/utils/health'

// Where today falls in the cycle, as a heading, a value and a detail: a
// period day, ovulation, the fertile window, or else when the next period
// is due. Shared by the log's overview and its card.
export const cycleSummary = ({
  entries,
  today,
  t,
  formatDate,
}: {
  entries: THealthEntry[]
  today: string
  t: TFunction
  formatDate: (date: string) => string
}) => {
  const period = periodStats(entries, today)
  if (!period) return
  const cycle = cycleToday(entriesOf(entries, 'period'), period, today)
  switch (cycle.kind) {
    case 'period': {
      return {
        label: t('health.period.calendar.period'),
        value: t('health.period.dayNumber', { day: cycle.day }),
        detail: t(
          cycle.isEndLogged
            ? 'health.period.until'
            : 'health.period.expectedUntil',
          { date: formatDate(cycle.end) },
        ),
      }
    }
    case 'ovulation': {
      return {
        label: t('health.period.ovulation'),
        value: t('health.period.ovulationToday'),
        detail: t('health.period.fertileUntil', {
          date: formatDate(cycle.fertileEnd),
        }),
      }
    }
    case 'fertile': {
      return {
        label: t('health.period.fertile'),
        value: t('health.period.until', {
          date: formatDate(cycle.fertileEnd),
        }),
        detail: t('health.period.ovulationOn', {
          date: formatDate(cycle.ovulation),
        }),
      }
    }
    default: {
      return {
        label: t('health.period.next'),
        value: formatDate(period.nextStart),
        detail:
          period.daysUntilNext >= 0
            ? t('health.period.inDays', { count: period.daysUntilNext })
            : t('health.period.late', { count: -period.daysUntilNext }),
      }
    }
  }
}
