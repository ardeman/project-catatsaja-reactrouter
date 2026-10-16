import { useTranslation } from 'react-i18next'

import { THealthEntryOf } from '~/lib/types/health'
import { cycleWindows, TPeriodAction } from '~/lib/utils/cycle-calendar'
import { today } from '~/lib/utils/finance'
import {
  daysBetween,
  entriesOf,
  newHealthEntryId,
  periodStats,
} from '~/lib/utils/health'

import { EntryList } from './entry-list'
import { PeriodCalendar } from './period-calendar'
import { TSectionProperties } from './type'

// Logged periods and what they suggest: the next period and the days it
// could fall on, the fertile window, ovulation and the average cycle, also
// on a calendar, where a period is logged by tapping its first and last
// days. Estimates, said as such.
export const PeriodSection = (properties: TSectionProperties) => {
  const { log, isReadOnly, onSaveEntry, onDeleteEntry } = properties
  const { t, i18n } = useTranslation()
  const now = today()
  const entries = entriesOf(log.content, 'period')
  const stats = periodStats(log.content, now)
  const dayFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  const date = (value: string) =>
    dayFormat.format(new Date(`${value}T00:00:00Z`))
  const range = ([from, to]: [string, string]) =>
    from === to ? date(from) : `${date(from)} – ${date(to)}`
  const windows = stats && cycleWindows(stats, stats.nextStart)
  const byId = (id: string) => entries.find((entry) => entry.id === id)

  // Without a logged last day, a period follows the expected length.
  const handleAction = (action: TPeriodAction, day: string) => {
    if (action.type === 'remove') return onDeleteEntry(action.id)
    if (action.type === 'start' && !action.id)
      return onSaveEntry({ id: newHealthEntryId(), kind: 'period', date: day })
    const period = action.id ? byId(action.id) : undefined
    if (!period) return
    const { end: _end, ...open }: THealthEntryOf<'period'> = period
    switch (action.type) {
      case 'start': {
        return onSaveEntry({ ...period, date: day })
      }
      case 'end': {
        return onSaveEntry({ ...period, end: day })
      }
      case 'clearEnd': {
        return onSaveEntry(open)
      }
    }
  }
  const calendar = (
    <PeriodCalendar
      periods={entries}
      stats={stats}
      today={now}
      isReadOnly={isReadOnly}
      onAction={handleAction}
    />
  )

  return (
    <EntryList
      {...properties}
      kind="period"
      entries={entries}
      emptyLabel={t('health.empty.period')}
      renderRow={(entry) => ({
        primary: entry.end
          ? t('health.period.lasted', {
              count: daysBetween(entry.date, entry.end) + 1,
            })
          : t('health.period.ongoing'),
        secondary: entry.flow ? t(`health.flow.${entry.flow}`) : undefined,
      })}
    >
      {stats && windows ? (
        <section className="glass-surface grid gap-3 rounded-xl border p-4">
          <dl className="grid grid-cols-2 gap-x-2 gap-y-3">
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">
                {t('health.period.next')}
              </dt>
              <dd className="text-lg font-semibold">
                {date(stats.nextStart)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {stats.daysUntilNext >= 0
                    ? t('health.period.inDays', { count: stats.daysUntilNext })
                    : t('health.period.late', { count: -stats.daysUntilNext })}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.cycleDay')}
              </dt>
              <dd className="font-medium">{stats.cycleDay}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.predicted')}
              </dt>
              <dd className="font-medium">{range(windows.predicted)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.possible')}
              </dt>
              <dd className="font-medium">{range(windows.possible)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.fertile')}
              </dt>
              <dd className="font-medium">{range(windows.fertile)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.ovulation')}
              </dt>
              <dd className="font-medium">{range(windows.ovulation)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.ovulationWindow')}
              </dt>
              <dd className="font-medium">{range(windows.ovulationWindow)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.averageCycle')}
              </dt>
              <dd className="font-medium">
                {t('health.period.days', { count: stats.cycleLength })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.averagePeriod')}
              </dt>
              <dd className="font-medium">
                {t('health.period.days', { count: stats.periodLength })}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            {stats.cycleCount === 0
              ? t('health.period.notEnough')
              : t('health.period.basedOn', { count: stats.cycleCount })}{' '}
            {t('health.period.disclaimer')}
          </p>
          {calendar}
        </section>
      ) : (
        !isReadOnly && calendar
      )}
    </EntryList>
  )
}
